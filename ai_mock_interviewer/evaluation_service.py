"""
Answer evaluation service using Gemini AI
"""

from google import genai
from google.genai import types
import json
import re
from typing import Dict, Any
from .models import (
    InterviewQuestion,
    InterviewAnswer,
    AnswerFeedback,
    STARComponent,
    QuestionType
)
from .prompts.answer_evaluation import (
    EVALUATION_SYSTEM_PROMPT,
    BEHAVIORAL_EVALUATION_PROMPT,
    TECHNICAL_EVALUATION_PROMPT,
    STAR_ANALYSIS_PROMPT
)
from .utils.logger import get_logger

logger = get_logger(__name__)


class AnswerEvaluationService:
    """
    Service for evaluating user answers using Gemini AI
    """

    def __init__(
        self,
        gemini_api_key: str,
        model_name: str = "gemini-2.5-flash"
    ):
        """
        Initialize evaluation service

        Args:
            gemini_api_key: Google Gemini API key
            model_name: Gemini model to use
        """
        self.client = genai.Client(api_key=gemini_api_key)
        self.model_name = model_name
        self.generation_config = types.GenerateContentConfig(
            temperature=0.4,
            top_p=0.95,
            top_k=40,
            max_output_tokens=4096,
        )

    def evaluate_answer(
        self,
        question: InterviewQuestion,
        answer: InterviewAnswer,
        job_description: str,
        resume_text: str
    ) -> AnswerFeedback:
        """
        Evaluate a user's answer to an interview question

        Args:
            question: The interview question
            answer: The user's answer
            job_description: Original job description
            resume_text: User's resume text

        Returns:
            AnswerFeedback with evaluation results

        Raises:
            ValueError: If evaluation fails
        """
        logger.info(f"Evaluating answer for question {question.question_id}")

        try:
            # Build evaluation prompt
            prompt = self._build_evaluation_prompt(
                question,
                answer,
                job_description,
                resume_text
            )

            # Call Gemini API
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=self.generation_config
            )

            # Parse feedback
            feedback_data = self._parse_evaluation_response(response.text)

            # Create AnswerFeedback object
            feedback = self._create_feedback_object(feedback_data, question)

            # Add STAR analysis for behavioral questions
            if question.question_type == QuestionType.BEHAVIORAL:
                feedback.star_analysis = self._analyze_star_method(answer.answer_text)

            logger.info(f"Evaluation complete: score={feedback.score}/10")
            return feedback

        except Exception as e:
            logger.error(f"Failed to evaluate answer: {e}")
            raise ValueError(f"Answer evaluation failed: {e}")

    def _build_evaluation_prompt(
        self,
        question: InterviewQuestion,
        answer: InterviewAnswer,
        job_description: str,
        resume_text: str
    ) -> str:
        """Build the evaluation prompt for Gemini"""

        # Get question-type specific template
        if question.question_type == QuestionType.BEHAVIORAL:
            template = BEHAVIORAL_EVALUATION_PROMPT
        elif question.question_type == QuestionType.TECHNICAL:
            template = TECHNICAL_EVALUATION_PROMPT
        else:
            template = EVALUATION_SYSTEM_PROMPT

        # Extract keywords from rubric
        keywords = question.evaluation_rubric.get("required_keywords", [])
        expected_points = question.evaluation_rubric.get("key_points", [])

        prompt = f"""
{template}

INTERVIEW QUESTION:
{question.question_text}

QUESTION TYPE: {question.question_type.value}
DIFFICULTY LEVEL: {question.difficulty_level}/5

EXPECTED TOPICS TO COVER:
{chr(10).join(f"- {topic}" for topic in question.expected_topics)}

{f"KEY POINTS TO ADDRESS:{chr(10)}" + chr(10).join(f"- {point}" for point in expected_points) if expected_points else ""}

{f"REQUIRED KEYWORDS:{chr(10)}" + chr(10).join(f"- {kw}" for kw in keywords) if keywords else ""}

JOB REQUIREMENTS (for context):
{job_description[:1000]}

CANDIDATE'S RESUME (for context):
{resume_text[:1500]}

CANDIDATE'S ANSWER:
{answer.answer_text}

Evaluate this answer and provide feedback in JSON format:
{{
  "score": 0-10,
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "keyword_coverage": 0.0-1.0,
  "missing_keywords": ["keyword1", "keyword2"],
  "suggested_improvements": "Specific suggestions...",
  "detailed_analysis": "Detailed explanation of score..."
}}

Provide the evaluation now:
"""
        return prompt

    def _parse_evaluation_response(self, response_text: str) -> Dict[str, Any]:
        """Parse Gemini's evaluation response"""

        # Clean up response
        response_text = response_text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        # Extract just the JSON object portion
        # Find the first '{' and the matching closing '}'
        try:
            start_idx = response_text.find('{')
            if start_idx == -1:
                raise ValueError("No JSON object found in response")

            # Find matching closing brace by counting braces
            brace_count = 0
            end_idx = -1
            for i in range(start_idx, len(response_text)):
                if response_text[i] == '{':
                    brace_count += 1
                elif response_text[i] == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        end_idx = i + 1
                        break

            if end_idx == -1:
                raise ValueError("No matching closing brace found")

            # Extract just the JSON object
            json_text = response_text[start_idx:end_idx]

            feedback_data = json.loads(json_text)
            return feedback_data
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse evaluation JSON: {e}")
            logger.debug(f"Response: {response_text[:500]}...")
            raise ValueError("Invalid JSON response from Gemini")
        except Exception as e:
            logger.error(f"Failed to extract JSON from response: {e}")
            logger.debug(f"Response: {response_text[:500]}...")
            raise ValueError(f"Could not extract JSON from response: {e}")

    def _create_feedback_object(
        self,
        feedback_data: Dict[str, Any],
        question: InterviewQuestion
    ) -> AnswerFeedback:
        """Convert raw feedback data to AnswerFeedback object"""

        return AnswerFeedback(
            score=float(feedback_data.get("score", 5.0)),
            strengths=feedback_data.get("strengths", []),
            improvements=feedback_data.get("improvements", []),
            keyword_coverage=float(feedback_data.get("keyword_coverage", 0.5)),
            missing_keywords=feedback_data.get("missing_keywords", []),
            suggested_improvements=feedback_data.get("suggested_improvements", ""),
            detailed_analysis=feedback_data.get("detailed_analysis", "")
        )

    def _analyze_star_method(self, answer_text: str) -> STARComponent:
        """
        Analyze if answer follows STAR method

        Args:
            answer_text: User's answer

        Returns:
            STARComponent with analysis
        """
        answer_lower = answer_text.lower()

        # Pattern matching for STAR components
        situation_indicators = [
            "situation", "context", "at the time", "when i was",
            "the project was", "we were working on"
        ]
        task_indicators = [
            "task", "challenge", "problem", "goal", "objective",
            "needed to", "had to", "was responsible for"
        ]
        action_indicators = [
            "i did", "i implemented", "i created", "i developed",
            "i worked", "my approach", "i decided", "i led"
        ]
        result_indicators = [
            "result", "outcome", "achieved", "reduced", "increased",
            "improved", "successfully", "completed", "%", "metric"
        ]

        # Check for each component
        has_situation = any(ind in answer_lower for ind in situation_indicators)
        has_task = any(ind in answer_lower for ind in task_indicators)
        has_action = any(ind in answer_lower for ind in action_indicators)
        has_result = any(ind in answer_lower for ind in result_indicators)

        # Calculate completeness score
        components_present = sum([has_situation, has_task, has_action, has_result])
        score = components_present / 4.0

        return STARComponent(
            situation=has_situation,
            task=has_task,
            action=has_action,
            result=has_result,
            score=score
        )
