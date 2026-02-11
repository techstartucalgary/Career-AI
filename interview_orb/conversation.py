import google.generativeai as genai
from . import config


SYSTEM_PROMPT = """You are an experienced interviewer conducting a live job interview.

## JOB DESCRIPTION:
{job_description}

## CANDIDATE'S RESUME:
{resume}

## ADDITIONAL TOPICS TO COVER:
{additional_topics}

## YOUR APPROACH:
1. Start with a warm welcome and an easy opening question.
2. Ask about specific experiences from their resume that relate to this role.
3. Ask behavioral questions ("Tell me about a time when...") tied to the job requirements.
4. Assess culture fit and motivation for this specific role.
5. Address any gaps or transitions in their background tactfully.
6. After ~8 questions, ask if they have questions for you, then wrap up.

## PACING RULE — THIS IS CRITICAL:
- You may ask AT MOST 2 follow-up questions on any single role, project, or topic.
- After 2 follow-ups, you MUST move on to a DIFFERENT role, project, or area of their resume.
- Cover breadth across their experience — don't camp on one thing.
- Track in your head: if you've asked about something twice already, switch topics.
- Aim to touch on at least 3-4 different experiences/roles across the interview.

## GUIDELINES:
- Reference specific items from their resume to make it personal.
- Connect questions back to requirements in the job description.
- Keep each response to 1-3 sentences. You are speaking out loud — be concise.
- Be warm, professional, and encouraging.
- Listen actively and ask natural follow-ups based on what they actually said — but respect the 2 follow-up limit.
- Do NOT read from a checklist. Have a real conversation.
- If their answer is vague, push for specifics: numbers, outcomes, lessons learned.
- Transition smoothly between topics. When moving on, briefly acknowledge their answer before switching."""


class InterviewConversation:
    def __init__(self, job_description: str, resume: str, additional_topics: str = ""):
        genai.configure(api_key=config.GEMINI_API_KEY)

        system_instruction = SYSTEM_PROMPT.format(
            job_description=job_description,
            resume=resume,
            additional_topics=additional_topics or "None specified — use your judgment based on the role.",
        )

        model = genai.GenerativeModel(
            model_name=config.GEMINI_MODEL,
            system_instruction=system_instruction,
            generation_config=genai.types.GenerationConfig(
                temperature=config.GEMINI_TEMPERATURE,
                max_output_tokens=1024,
            ),
        )

        self.chat = model.start_chat(history=[])

    def _send(self, text: str) -> str:
        response = self.chat.send_message(text)
        return response.text

    def start_interview(self) -> str:
        return self._send(
            "Begin the interview. Greet the candidate warmly, mention you've reviewed "
            "their resume, and ask your first question."
        )

    def respond(self, candidate_input: str) -> str:
        return self._send(candidate_input)

    def wrap_up(self) -> str:
        return self._send(
            "The candidate is ready to wrap up. Give a warm closing, "
            "thank them for their time, and mention next steps."
        )

    def prompt_wrap_up(self, candidate_input: str) -> str:
        return self._send(
            f"Candidate said: {candidate_input}\n\n"
            "We're nearing the end of our time. Respond to what they said, "
            "then ask if they have any questions for you, or begin wrapping up."
        )
