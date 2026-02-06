"""
Interview question generation service using Gemini AI
"""

from google import genai
from google.genai import types
from typing import List, Dict, Any
import json
import hashlib
from .models import (
    ResumeInput,
    JobDescriptionInput,
    InterviewConfig,
    InterviewQuestion,
    QuestionType,
    DifficultyLevel,
    InterviewType
)
from .prompts.question_generation import (
    QUESTION_GENERATION_SYSTEM_PROMPT,
    BEHAVIORAL_QUESTION_EXAMPLES,
    TECHNICAL_QUESTION_EXAMPLES
)
from .utils.logger import get_logger

logger = get_logger(__name__)


class InterviewGenerator:
    """
    Generates personalized interview questions using Gemini AI
    """

    def __init__(self, gemini_api_key: str, model_name: str = "gemini-2.5-flash"):
        """
        Initialize the interview generator

        Args:
            gemini_api_key: Google Gemini API key
            model_name: Gemini model to use
        """
        self.client = genai.Client(api_key=gemini_api_key)
        self.model_name = model_name
        self.generation_config = types.GenerateContentConfig(
            temperature=0.7,
            top_p=0.95,
            top_k=40,
            max_output_tokens=8192,
        )

    def generate_questions(
        self,
        resume: ResumeInput,
        job_description: JobDescriptionInput,
        config: InterviewConfig
    ) -> List[InterviewQuestion]:
        """
        Generate interview questions based on resume and job description

        Args:
            resume: Resume input data
            job_description: Job description input
            config: Interview configuration

        Returns:
            List of generated interview questions

        Raises:
            ValueError: If generation fails
        """
        logger.info(f"Generating {config.num_questions} questions")

        try:
            # Build the prompt
            prompt = self._build_generation_prompt(resume, job_description, config)

            # Call Gemini API
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=self.generation_config
            )

            # Parse JSON response
            questions_data = self._parse_gemini_response(response.text)

            # Convert to InterviewQuestion objects
            questions = self._create_question_objects(questions_data, config)

            logger.info(f"Successfully generated {len(questions)} questions")
            return questions

        except Exception as e:
            logger.error(f"Failed to generate questions: {e}")
            raise ValueError(f"Question generation failed: {e}")

    def _build_generation_prompt(
        self,
        resume: ResumeInput,
        job_description: JobDescriptionInput,
        config: InterviewConfig
    ) -> str:
        """Build the complete prompt for Gemini"""

        # Extract resume summary (first 3000 chars to fit context)
        resume_text = resume.raw_text[:3000]
        if resume.parsed_data:
            resume_text = self._format_parsed_resume(resume.parsed_data)

        # Extract job description (first 2000 chars)
        job_text = job_description.raw_text[:2000]

        # Determine question type distribution
        distribution = self._calculate_question_distribution(config)

        prompt = f"""
{QUESTION_GENERATION_SYSTEM_PROMPT}

CANDIDATE RESUME:
{resume_text}

JOB DESCRIPTION:
{job_text}

INTERVIEW PARAMETERS:
- Difficulty Level: {config.difficulty.value}
- Total Questions: {config.num_questions}
- Question Distribution:
  * Behavioral: {distribution['behavioral']} questions
  * Technical: {distribution['technical']} questions
  * Situational: {distribution['situational']} questions
  * Resume-Specific: {distribution['resume_specific']} questions

REQUIREMENTS:
1. Generate EXACTLY {config.num_questions} questions
2. Questions must be specific to the candidate's experience in the resume
3. Questions must align with the job description requirements
4. Difficulty should be appropriate for {config.difficulty.value} level
5. Include at least {distribution['resume_specific']} questions that directly reference the resume

OUTPUT FORMAT (JSON Array):
[
  {{
    "question_text": "The question to ask",
    "question_type": "behavioral|technical|situational|resume_specific",
    "difficulty_level": 1-5,
    "expected_topics": ["topic1", "topic2"],
    "context": "Optional: Which resume item this references",
    "evaluation_rubric": {{
      "key_points": ["point1", "point2"],
      "required_keywords": ["keyword1", "keyword2"]
    }}
  }}
]

Generate the questions now:
"""
        return prompt

    def _calculate_question_distribution(
        self,
        config: InterviewConfig
    ) -> Dict[str, int]:
        """Calculate how many questions of each type to generate"""

        total = config.num_questions

        if config.interview_type == InterviewType.BEHAVIORAL:
            return {
                "behavioral": total - 1,
                "technical": 0,
                "situational": 0,
                "resume_specific": 1
            }
        elif config.interview_type == InterviewType.TECHNICAL:
            return {
                "behavioral": 0,
                "technical": total - 1,
                "situational": 0,
                "resume_specific": 1
            }
        else:  # MIXED
            return {
                "behavioral": total // 3,
                "technical": total // 3,
                "situational": total // 4,
                "resume_specific": total - (total // 3 + total // 3 + total // 4)
            }

    def _parse_gemini_response(self, response_text: str) -> List[Dict[str, Any]]:
        """Parse Gemini's JSON response"""

        # Remove markdown code blocks if present
        response_text = response_text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        response_text = response_text.strip()

        # Extract just the JSON array portion
        # Find the first '[' and the matching closing ']'
        try:
            start_idx = response_text.find('[')
            if start_idx == -1:
                raise ValueError("No JSON array found in response")

            # Find matching closing bracket by counting brackets
            bracket_count = 0
            end_idx = -1
            for i in range(start_idx, len(response_text)):
                if response_text[i] == '[':
                    bracket_count += 1
                elif response_text[i] == ']':
                    bracket_count -= 1
                    if bracket_count == 0:
                        end_idx = i + 1
                        break

            if end_idx == -1:
                raise ValueError("No matching closing bracket found")

            # Extract just the JSON array
            json_text = response_text[start_idx:end_idx]

            questions_data = json.loads(json_text)
            return questions_data
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.debug(f"Response text: {response_text[:500]}...")
            raise ValueError("Invalid JSON response from Gemini")
        except Exception as e:
            logger.error(f"Failed to extract JSON from response: {e}")
            logger.debug(f"Response text: {response_text[:500]}...")
            raise ValueError(f"Could not extract JSON from response: {e}")

    def _create_question_objects(
        self,
        questions_data: List[Dict[str, Any]],
        config: InterviewConfig
    ) -> List[InterviewQuestion]:
        """Convert raw question data to InterviewQuestion objects"""

        questions = []
        for idx, q_data in enumerate(questions_data):
            question_id = self._generate_question_id(q_data["question_text"], idx)

            question = InterviewQuestion(
                question_id=question_id,
                question_text=q_data["question_text"],
                question_type=QuestionType(q_data["question_type"]),
                difficulty_level=q_data.get("difficulty_level", 3),
                expected_topics=q_data.get("expected_topics", []),
                context=q_data.get("context"),
                evaluation_rubric=q_data.get("evaluation_rubric", {})
            )
            questions.append(question)

        return questions

    def _generate_question_id(self, question_text: str, index: int) -> str:
        """Generate unique question ID"""
        hash_input = f"{question_text}{index}".encode('utf-8')
        return hashlib.md5(hash_input).hexdigest()[:12]

    def _format_parsed_resume(self, parsed_data: Dict[str, Any]) -> str:
        """Format parsed resume data for prompt"""
        sections = []

        if "name" in parsed_data:
            sections.append(f"Name: {parsed_data['name']}")

        if "experience" in parsed_data:
            sections.append("\nEXPERIENCE:")
            for exp in parsed_data["experience"]:
                sections.append(f"- {exp.get('title')} at {exp.get('company')}")
                for bullet in exp.get('bullets', []):
                    sections.append(f"  • {bullet}")

        if "projects" in parsed_data:
            sections.append("\nPROJECTS:")
            for proj in parsed_data["projects"]:
                sections.append(f"- {proj.get('name')}")

        if "skills" in parsed_data:
            skills = parsed_data["skills"]
            if isinstance(skills, dict):
                sections.append("\nSKILLS:")
                for category, skill_list in skills.items():
                    if skill_list:
                        sections.append(f"{category}: {', '.join(skill_list)}")

        return "\n".join(sections)
