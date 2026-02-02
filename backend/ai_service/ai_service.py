"""
AI service for resume enhancement and cover letter generation.
Centralizes all LLM interactions.
"""

import json
import re
from typing import List, Dict, Tuple, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from .models import ResumeData, CoverLetter, CoverLetterTone, CompanyResearch, SemanticAnalysisResult
from .config import (
    GEMINI_API_KEY, GEMINI_MODEL, GEMINI_TEMPERATURE, GEMINI_TIMEOUT, GEMINI_MAX_RETRIES,
    CONTEXT_JOB_DESCRIPTION, CONTEXT_RESUME_TEXT, CONTEXT_RESUME_JSON,
    CONTEXT_COVER_LETTER_JD, CONTEXT_COVER_LETTER_RESUME,
    MAX_REFINEMENT_ITERATIONS, REFINEMENT_TEMPERATURE
)


# Few-shot examples for cover letters (high-quality templates)
COVER_LETTER_EXAMPLES = """
=== EXAMPLE 1: Tech Startup (Enthusiastic, Impact-Focused) ===
CONTEXT: Software Engineer applying to a fast-growing fintech startup

Opening:
"Three years ago, I automated a payment reconciliation process that saved my team 200 hours monthly—and realized I wanted to spend my career making fintech faster and smarter. That's why Stripe's mission to increase the GDP of the internet immediately resonated with me when I saw the Senior Backend Engineer opening."

Body:
"At my current role at PaymentCo, I architected a real-time fraud detection system processing 50,000 transactions per second with 99.99% uptime. When latency spiked during Black Friday, I led a 48-hour optimization sprint that reduced response times by 73%. These high-stakes moments taught me that great infrastructure isn't just about code—it's about enabling millions of businesses to operate seamlessly."

"Beyond technical execution, I thrive in Stripe's kind of collaborative, documentation-driven culture. I've authored internal RFCs that shaped our API versioning strategy and mentored three junior engineers through their first production deployments. I believe my combination of distributed systems expertise and commitment to engineering excellence aligns well with your team's standards."

Closing:
"I'd love to discuss how my experience scaling payment infrastructure could contribute to Stripe's next chapter of growth. I'm particularly excited about [specific product/initiative mentioned in job post]. Thank you for considering my application."

=== EXAMPLE 2: Enterprise (Professional, Leadership-Oriented) ===
CONTEXT: Engineering Manager applying to established tech company

Opening:
"Leading a team through a complex microservices migration taught me that the best technical decisions are ultimately people decisions. When I read about Microsoft's focus on engineering excellence and inclusive team culture, I recognized an environment where my leadership philosophy could flourish."

Body:
"As Engineering Manager at TechCorp, I grew my team from 4 to 12 engineers while maintaining our deployment velocity. My approach centers on clear expectations, psychological safety, and celebrating both successes and instructive failures. Last quarter, this culture enabled us to deliver a platform modernization project 3 weeks ahead of schedule—the first on-time delivery in our division's history."

"I'm particularly drawn to Microsoft's commitment to growth mindset and continuous learning. In my current role, I established a weekly 'Tech Radar' session where team members present emerging technologies, which has directly influenced three successful architectural decisions and significantly improved retention among senior engineers."

Closing:
"I would welcome the opportunity to discuss how my experience building high-performing engineering teams aligns with the Engineering Manager role. I'm especially interested in learning more about the team's current challenges and how I might contribute to their success."

=== EXAMPLE 3: Creative/Design-Forward (Personality-Driven) ===
CONTEXT: Product Designer applying to a design-focused company

Opening:
"The moment I saw Figma's collaborative features in action, I stopped using every other design tool. That wasn't just about functionality—it was about understanding that design is fundamentally a team sport. Now I want to help build the tools that enable that collaboration."

Body:
"At DesignStudio, I led the redesign of our enterprise dashboard, conducting 47 user interviews that revealed our customers didn't want more features—they wanted fewer clicks. The resulting simplified navigation increased task completion rates by 34% and became a case study in our design system documentation. I learned that the best design solutions often mean removing complexity, not adding it."

"What excites me most about Figma is your willingness to challenge design tool conventions. I've followed your journey from the skepticism around browser-based design to becoming the industry standard, and I see parallels to my own career betting on emerging technologies and unconventional approaches."

Closing:
"I'd love to explore how my experience in enterprise UX and passion for collaborative design tools could contribute to Figma's product team. I'm particularly curious about your approach to balancing power-user needs with accessibility for new designers."
"""


class AIService:
    """
    Handles all AI/LLM operations.

    Responsibilities:
    - Gap analysis between resume and job description
    - Resume enhancement/tailoring
    - Cover letter generation
    - Question generation for user clarification
    """

    def __init__(self):
        """Initialize LLM client"""
        self.llm = ChatGoogleGenerativeAI(
            model=GEMINI_MODEL,
            temperature=GEMINI_TEMPERATURE,
            google_api_key=GEMINI_API_KEY,
            request_timeout=GEMINI_TIMEOUT,
            max_retries=GEMINI_MAX_RETRIES
        )

    # ============================================================
    # COMPANY RESEARCH & PERSONALIZATION
    # ============================================================

    def research_company(self, company_name: str, job_description: str) -> CompanyResearch:
        """
        Research company to gather info for personalized cover letter.

        Extracts information from job description and uses LLM to infer
        company culture, values, and context.

        Args:
            company_name: Name of the company
            job_description: Job posting text

        Returns:
            CompanyResearch object with gathered information
        """
        print(f"\n🔍 Researching {company_name}...")

        prompt = f"""Analyze this job posting to extract company information for a personalized cover letter.

=== COMPANY NAME ===
{company_name}

=== JOB DESCRIPTION ===
{job_description[:CONTEXT_JOB_DESCRIPTION]}

=== EXTRACTION TASK ===
Based on the job description, extract or infer:

1. MISSION/PURPOSE: What is the company trying to achieve? What problem do they solve?
2. VALUES: What values are emphasized? (e.g., innovation, collaboration, customer-focus)
3. CULTURE KEYWORDS: Words that describe their work environment (e.g., fast-paced, remote-friendly, diverse)
4. INDUSTRY: What industry/sector are they in?
5. COMPANY SIZE HINTS: Any hints about company size? (startup, growing, enterprise)
6. RECENT INITIATIVES: Any products, features, or initiatives mentioned?

=== OUTPUT FORMAT ===
Return ONLY valid JSON:
{{
    "company_name": "{company_name}",
    "mission": "Their core mission or purpose (1-2 sentences)",
    "values": ["value1", "value2", "value3"],
    "recent_news": ["initiative or product mentioned 1", "initiative 2"],
    "culture_keywords": ["keyword1", "keyword2", "keyword3"],
    "industry": "industry name",
    "company_size": "startup/growth/enterprise/unknown",
    "founded": null
}}

JSON:"""

        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            json_text = self._extract_json(response.content)
            data = json.loads(json_text)

            research = CompanyResearch(**data)
            print(f"  ✓ Found: {research.industry or 'unknown industry'}, {len(research.values)} values, {len(research.culture_keywords)} culture keywords")
            return research

        except Exception as e:
            print(f"  ⚠ Company research failed: {e}")
            return CompanyResearch(company_name=company_name)

    def find_hiring_manager(self, job_description: str, company_name: str) -> Optional[str]:
        """
        Attempt to find hiring manager name from job description.

        Args:
            job_description: Job posting text
            company_name: Company name for context

        Returns:
            Hiring manager name if found, None otherwise
        """
        print("  🔍 Looking for hiring manager name...")

        # First, try pattern matching for common formats
        patterns = [
            r'(?:contact|reach out to|email|apply to|send.*to)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)',
            r'(?:hiring manager|recruiter|talent)(?:\s*[:\-])?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)',
            r'([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s*[,\-]\s*(?:Recruiter|Hiring Manager|HR|Talent))',
            r'Dear\s+([A-Z][a-z]+\s+[A-Z][a-z]+)',
        ]

        for pattern in patterns:
            match = re.search(pattern, job_description)
            if match:
                name = match.group(1).strip()
                # Basic validation - should be 2 words, reasonable length
                if len(name.split()) == 2 and 5 <= len(name) <= 40:
                    print(f"    ✓ Found: {name}")
                    return name

        # If no pattern match, use LLM to extract
        prompt = f"""Extract the hiring manager or recruiter name from this job posting if mentioned.

JOB POSTING:
{job_description[:2000]}

TASK: Find any person's name who is:
- Listed as hiring manager or recruiter
- Listed as contact person
- Signed the posting
- Should receive applications

Return ONLY a JSON object:
{{
    "found": true/false,
    "name": "First Last" or null,
    "confidence": "high/medium/low"
}}

JSON:"""

        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            json_text = self._extract_json(response.content)
            data = json.loads(json_text)

            if data.get('found') and data.get('name') and data.get('confidence') in ['high', 'medium']:
                print(f"    ✓ Found: {data['name']} (confidence: {data['confidence']})")
                return data['name']
            else:
                print("    ℹ No hiring manager name found, using 'Hiring Manager'")
                return None

        except Exception:
            return None

    def determine_tone(self, job_description: str, company_research: CompanyResearch) -> CoverLetterTone:
        """
        Determine appropriate tone for cover letter based on company context.

        Args:
            job_description: Job posting text
            company_research: Research about the company

        Returns:
            CoverLetterTone with appropriate settings
        """
        print("  🎨 Determining appropriate tone...")

        # Use heuristics first for speed
        jd_lower = job_description.lower()

        # Startup indicators
        startup_keywords = ['fast-paced', 'startup', 'early-stage', 'seed', 'series a', 'venture',
                           'disrupt', 'innovative', 'hustle', 'wear many hats', 'scrappy']
        startup_score = sum(1 for kw in startup_keywords if kw in jd_lower)

        # Enterprise indicators
        enterprise_keywords = ['fortune 500', 'enterprise', 'established', 'global', 'compliance',
                              'governance', 'stakeholder', 'cross-functional', 'matrix']
        enterprise_score = sum(1 for kw in enterprise_keywords if kw in jd_lower)

        # Creative indicators
        creative_keywords = ['creative', 'design', 'brand', 'storytelling', 'content',
                            'user experience', 'ux', 'artistic', 'innovative']
        creative_score = sum(1 for kw in creative_keywords if kw in jd_lower)

        # Determine style based on scores
        if startup_score >= 3 or company_research.company_size == 'startup':
            style = 'enthusiastic'
            industry_context = 'startup'
        elif enterprise_score >= 3 or company_research.company_size == 'enterprise':
            style = 'formal'
            industry_context = 'enterprise'
        elif creative_score >= 3:
            style = 'conversational'
            industry_context = 'creative'
        else:
            style = 'professional'
            industry_context = company_research.industry or 'technical'

        # Extract personality traits from job description
        traits = []
        trait_keywords = {
            'analytical': ['analytical', 'data-driven', 'metrics', 'quantitative'],
            'collaborative': ['team', 'collaborative', 'cross-functional', 'together'],
            'innovative': ['innovative', 'creative', 'novel', 'pioneering'],
            'detail-oriented': ['detail', 'meticulous', 'thorough', 'precise'],
            'leadership': ['lead', 'mentor', 'manage', 'guide', 'influence']
        }

        for trait, keywords in trait_keywords.items():
            if any(kw in jd_lower for kw in keywords):
                traits.append(trait)

        tone = CoverLetterTone(
            style=style,
            personality_traits=traits[:3],
            industry_context=industry_context
        )

        print(f"    ✓ Style: {style}, Context: {industry_context}, Traits: {traits[:3]}")
        return tone

    def analyze_gaps(
            self,
            resume: ResumeData,
            job_description: str,
            semantic_analysis: SemanticAnalysisResult = None
    ) -> Tuple[List[Dict], str]:
        """
        Analyze gaps between resume and job requirements.

        Uses semantic analysis results (if provided) to focus on real gaps.

        Args:
            resume: Structured resume data
            job_description: Target job posting
            semantic_analysis: Optional semantic matching results

        Returns:
            Tuple of (questions_list, analysis_summary)
        """
        print("\n🎯 Analyzing resume fit...")

        resume_text = resume.to_text()

        # Build comprehensive context from semantic analysis if available
        semantic_context = ""
        if semantic_analysis:
            semantic_context = self._build_rich_semantic_context(semantic_analysis)

        prompt = f"""You are an expert career coach helping tailor a resume to a specific job.

TASK: Analyze the resume against the job description using chain-of-thought reasoning.

{semantic_context}

=== JOB DESCRIPTION ===
{job_description[:CONTEXT_JOB_DESCRIPTION]}

=== CURRENT RESUME ===
{resume_text[:CONTEXT_RESUME_TEXT]}

=== RESUME STRUCTURE ===
- {len(resume.experience)} work experience entries
- {len(resume.projects)} project entries

=== ANALYSIS PROCESS (Think step by step) ===

Step 1: EXTRACT KEY REQUIREMENTS
First, identify the top 5-8 critical requirements from the job description:
- Required technical skills
- Years of experience needed
- Soft skills emphasized
- Industry-specific terms

Step 2: MAP RESUME TO REQUIREMENTS
For each requirement, check:
- Is it explicitly mentioned in the resume?
- Is it implied but not clearly stated?
- Is it completely missing?

Step 3: IDENTIFY ENHANCEMENT OPPORTUNITIES
Look for:
- Vague bullets that lack metrics (which role?)
- Relevant experience buried or underemphasized
- Missing keywords that candidate likely has experience with

Step 4: GENERATE TARGETED QUESTIONS
Create questions that are SPECIFIC to individual experiences or projects.
Format: "For your [Job Title] at [Company] role: [specific question]"

=== FEW-SHOT EXAMPLES ===

EXAMPLE 1 - Quantification Question:
Job requires: "experience scaling systems"
Resume says: "Improved system performance"
GOOD Question: "For your Software Engineer at TechCorp role: What was the scale of the performance improvement? (e.g., latency reduced from X to Y, handled N more requests)"
WHY: Transforms vague claim into quantified achievement

EXAMPLE 2 - Hidden Skill Question:
Job requires: "CI/CD experience"
Resume mentions: "deployed code regularly"
GOOD Question: "For your Backend Developer at StartupXYZ role: Which CI/CD tools did you use for deployments? (Jenkins, GitHub Actions, CircleCI, etc.)"
WHY: Surfaces implicit skill to match job requirement

EXAMPLE 3 - Leadership Question:
Job requires: "team leadership"
Resume shows: Senior role but no leadership mentioned
GOOD Question: "For your Senior Engineer at BigCo role: Did you mentor junior developers or lead any initiatives? How many people?"
WHY: Uncovers leadership experience for senior-level jobs

=== OUTPUT FORMAT ===
Return ONLY valid JSON (no markdown, no explanation outside JSON):
{{
  "thinking": "Brief chain-of-thought: key requirements found, gaps identified, strategy for questions",
  "analysis": "2-3 sentence summary of gaps and opportunities for the user",
  "key_requirements": ["requirement1", "requirement2", ...],
  "questions": [
    {{"id": 1, "question": "For your [specific role]: what metrics can you share?", "context": "why this matters for the job", "applies_to": "exact role title or 'general'", "targets_gap": "which requirement this addresses"}},
    ...
  ]
}}

Generate 5-8 targeted questions. JSON:"""

        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            json_text = self._extract_json(response.content)
            data = json.loads(json_text)

            print(f"  ✓ Generated {len(data['questions'])} clarifying questions")
            return data['questions'], data['analysis']

        except Exception as e:
            print(f"  ⚠ Gap analysis failed: {e}")
            return [], "Analysis unavailable"

    def tailor_resume(
            self,
            resume: ResumeData,
            job_description: str,
            user_answers: Dict[int, str],
            questions: List[Dict],
            semantic_analysis: Optional[SemanticAnalysisResult] = None
    ) -> ResumeData:
        """
        Enhance resume bullets using job description, user answers, and semantic analysis.

        Args:
            resume: Original resume
            job_description: Target job
            user_answers: Dict mapping question IDs to answers
            questions: List of questions asked
            semantic_analysis: Optional semantic matching results for targeted enhancement

        Returns:
            Enhanced ResumeData
        """
        print("\n✨ Tailoring resume...")

        # Format Q&A context with better structure
        qa_lines = []
        if user_answers:
            for q in questions:
                if q['id'] in user_answers:
                    applies_to = q.get('applies_to', 'general')
                    qa_lines.append(f"[Applies to: {applies_to}]")
                    qa_lines.append(f"Q: {q['question']}")
                    qa_lines.append(f"A: {user_answers[q['id']]}")
                    qa_lines.append("")  # blank line
            qa_context = "\n".join(qa_lines)
        else:
            qa_context = "No additional information provided"

        original_data = json.loads(resume.json())

        # Extract keywords explicitly for targeted optimization
        extracted_keywords = self._extract_priority_keywords(job_description)
        keywords_str = ", ".join(extracted_keywords[:15])

        # Build semantic context for targeted bullet enhancement
        semantic_context = ""
        bullets_to_prioritize = ""
        if semantic_analysis:
            semantic_context = self._build_rich_semantic_context(semantic_analysis)

            # Identify specific bullets to prioritize based on weak matches
            weak_bullets = []
            for gap in semantic_analysis.gaps:
                if gap.get('status') == 'weak':
                    weak_bullets.append({
                        'requirement': gap.get('job_requirement', '')[:80],
                        'current_bullet': gap.get('best_match', '')[:80],
                        'similarity': gap.get('similarity', 0),
                        'target': 0.80
                    })

            if weak_bullets:
                bullets_to_prioritize = f"""
=== PRIORITY BULLETS TO ENHANCE ===
These bullets have weak matches and should be prioritized for enhancement:
{json.dumps(weak_bullets[:5], indent=2)}

For each weak bullet above:
- Boost similarity from current level to 80%+
- Add relevant keywords from the job requirement
- Add metrics if possible
"""

        prompt = f"""You are an expert resume writer optimizing a resume for ATS systems and hiring managers.

TASK: Enhance resume bullet points using chain-of-thought reasoning, semantic analysis, and keyword optimization.

=== PRIORITY KEYWORDS TO INCORPORATE ===
{keywords_str}

{semantic_context}

{bullets_to_prioritize}

=== JOB DESCRIPTION ===
{job_description[:CONTEXT_JOB_DESCRIPTION]}

=== CURRENT RESUME (JSON) ===
{json.dumps(original_data, indent=2)[:CONTEXT_RESUME_JSON]}

=== CANDIDATE'S ADDITIONAL INFO ===
{qa_context}

=== ENHANCEMENT PROCESS (Think step by step) ===

Step 1: ADDRESS SEMANTIC GAPS FIRST
- Focus on the WEAK MATCHES identified above
- These bullets need the most improvement
- Boost their similarity to job requirements from current level to 80%+

Step 2: IDENTIFY KEYWORD GAPS
For each priority keyword, check if it's already in the resume:
- Present: Keep and strengthen
- Missing but candidate has experience: ADD naturally
- Missing and no evidence: Skip (don't fabricate)

Step 3: ENHANCE EACH BULLET
For each bullet point:
a) Does it have metrics? If not and user provided some, add them
b) Does it use a strong action verb? If not, upgrade it
c) Can a priority keyword be added naturally? If yes, add it
d) Is it ATS-friendly? Remove jargon, be specific
e) Does it address a semantic gap? If yes, prioritize enhancement

Step 4: APPLY USER ANSWERS CORRECTLY
- Check "[Applies to: ...]" tag for each answer
- ONLY add info to the matching experience/project
- NEVER cross-contaminate between roles

=== FEW-SHOT EXAMPLES ===

EXAMPLE 1 - Adding Metrics:
BEFORE: "Improved application performance"
User Answer: "Reduced load time from 3s to 0.8s"
AFTER: "Optimized application performance, reducing page load time from 3s to 0.8s (73% improvement)"

EXAMPLE 2 - Keyword Integration:
Priority Keywords: ["machine learning", "Python", "data pipelines"]
BEFORE: "Built data processing system"
AFTER: "Engineered scalable data pipelines in Python for machine learning model training"

EXAMPLE 3 - Action Verb Upgrade:
BEFORE: "Was responsible for database management"
AFTER: "Architected and maintained PostgreSQL databases serving 10M+ daily queries"

EXAMPLE 4 - Correct Answer Application:
Answer: "[Applies to: Software Engineer at TechCorp] Led team of 5 engineers"
TechCorp bullet: ADD leadership info
Other roles: DO NOT add this info

=== CRITICAL CONSTRAINTS ===
1. PRESERVE STRUCTURE: Exactly {len(original_data['experience'])} experiences, {len(original_data['projects'])} projects
2. PRESERVE IDENTITY: Never change titles, companies, names, dates, schools, degrees, locations
3. ONLY MODIFY: Bullet point text within each entry
4. NEVER FABRICATE: Only use info from original resume or user answers
5. ANSWER FIDELITY: Apply answers only to their designated "[Applies to:]" target

=== OUTPUT FORMAT ===
Return ONLY valid JSON matching the input schema exactly.
Start with {{"header":

JSON:"""

        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            json_text = self._extract_json(response.content)
            data = json.loads(json_text)

            # Ensure all sections exist (fallback to original if missing)
            for key in ['header', 'education', 'experience', 'projects', 'skills']:
                if key not in data:
                    print(f"  ⚠ Missing {key}, using original")
                    data[key] = original_data[key]

            # CRITICAL VALIDATION: Ensure count preservation
            if len(data['experience']) != len(original_data['experience']):
                print(
                    f"  ❌ ERROR: LLM changed experience count from {len(original_data['experience'])} to {len(data['experience'])}")
                print(f"  ⚠ Reverting to original experiences")
                data['experience'] = original_data['experience']

            if len(data['projects']) != len(original_data['projects']):
                print(
                    f"  ❌ ERROR: LLM changed project count from {len(original_data['projects'])} to {len(data['projects'])}")
                print(f"  ⚠ Reverting to original projects")
                data['projects'] = original_data['projects']

            # Validate that titles/companies haven't changed
            for i, (orig, new) in enumerate(zip(original_data['experience'], data['experience'])):
                if orig['title'] != new['title'] or orig['company'] != new['company']:
                    print(f"  ⚠ Warning: Experience {i + 1} title/company changed, reverting")
                    data['experience'][i] = orig

            for i, (orig, new) in enumerate(zip(original_data['projects'], data['projects'])):
                if orig['name'] != new['name']:
                    print(f"  ⚠ Warning: Project {i + 1} name changed, reverting")
                    data['projects'][i] = orig

            tailored = ResumeData(**data)
            print("  ✓ Resume tailored successfully")
            return tailored

        except Exception as e:
            print(f"  ⚠ Tailoring failed: {e}, using original")
            return resume

    def generate_cover_letter(
            self,
            resume: ResumeData,
            job_description: str,
            company_name: str,
            position: str,
            tone: Optional[CoverLetterTone] = None,
            company_research: Optional[CompanyResearch] = None,
            hiring_manager: Optional[str] = None,
            version: str = "A"
    ) -> CoverLetter:
        """
        Generate personalized cover letter with tone customization and company research.

        Args:
            resume: Candidate's resume
            job_description: Job posting
            company_name: Target company
            position: Job title
            tone: Optional tone settings (auto-detected if not provided)
            company_research: Optional pre-fetched company research
            hiring_manager: Optional hiring manager name
            version: Version identifier for A/B testing

        Returns:
            CoverLetter object
        """
        print(f"\n📝 Generating cover letter (Version {version})...")

        # Gather company research if not provided
        if company_research is None:
            company_research = self.research_company(company_name, job_description)

        # Determine tone if not provided
        if tone is None:
            tone = self.determine_tone(job_description, company_research)

        # Find hiring manager if not provided
        if hiring_manager is None:
            hiring_manager = self.find_hiring_manager(job_description, company_name)
        hiring_manager = hiring_manager or "Hiring Manager"

        resume_text = resume.to_text()

        # Extract key themes for personalization
        key_themes = self._extract_priority_keywords(job_description)[:8]
        themes_str = ", ".join(key_themes)

        # Build tone instructions
        tone_instructions = self._build_tone_instructions(tone)

        # Build company context
        company_context = self._build_company_context(company_research)

        prompt = f"""You are an expert cover letter writer creating a compelling, personalized letter.

TASK: Generate a cover letter that tells a story connecting the candidate to this specific role.

=== POSITION ===
{position} at {company_name}
Hiring Manager: {hiring_manager}

=== COMPANY RESEARCH ===
{company_context}

=== TONE & STYLE INSTRUCTIONS ===
{tone_instructions}

=== KEY THEMES TO ADDRESS ===
{themes_str}

=== JOB DESCRIPTION ===
{job_description[:CONTEXT_COVER_LETTER_JD]}

=== CANDIDATE RESUME ===
{resume_text[:CONTEXT_COVER_LETTER_RESUME]}

=== HIGH-QUALITY EXAMPLES ===
Study these examples for inspiration on structure and quality:

{COVER_LETTER_EXAMPLES}

=== WRITING PROCESS (Think step by step) ===

Step 1: PERSONALIZE THE HOOK
- Reference something specific about {company_name} (their mission, product, or recent initiative)
- Connect your most impressive relevant achievement to their needs
- Make it clear you researched this specific company

Step 2: SELECT EVIDENCE (2-3 achievements)
- Pick achievements that directly address the job requirements
- Include specific metrics and outcomes
- Show progression and impact

Step 3: MATCH THE TONE
- Style: {tone.style}
- Emphasize traits: {', '.join(tone.personality_traits) if tone.personality_traits else 'professionalism'}
- Industry context: {tone.industry_context or 'technical'}

Step 4: CRAFT AUTHENTIC CLOSING
- Reference a specific aspect of the role you're excited about
- Show genuine enthusiasm without being over-the-top
- Include a clear call to action

=== STRUCTURE ===
Paragraph 1 (Opening): Personalized hook mentioning {company_name} specifically + why this role
Paragraph 2 (Body 1): Most relevant experience with specific metrics
Paragraph 3 (Body 2): Additional skills/achievements matching requirements
Paragraph 4 (Closing): Genuine enthusiasm + specific call to action

=== CONSTRAINTS ===
- 300-400 words total
- NO generic phrases ("I am a hard worker", "team player", "passionate individual")
- Every claim must be backed by resume evidence
- Use "{company_name}" specifically, NEVER "your company" or "your organization"
- Address "{hiring_manager}" in salutation
- Match the {tone.style} tone throughout

=== OUTPUT FORMAT ===
Return ONLY valid JSON:
{{
  "paragraphs": ["opening...", "body1...", "body2...", "closing..."],
  "company_name": "{company_name}",
  "position": "{position}",
  "hiring_manager": "{hiring_manager}"
}}

JSON:"""

        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            json_text = self._extract_json(response.content)
            data = json.loads(json_text)

            # Add tone and version to the cover letter
            data['tone'] = tone.model_dump() if tone else None
            data['version'] = version

            cover_letter = CoverLetter(**data)
            word_count = len(' '.join(cover_letter.paragraphs).split())
            print(f"  ✓ Cover letter generated ({word_count} words, {tone.style} tone)")
            return cover_letter

        except Exception as e:
            raise ValueError(f"Cover letter generation failed: {str(e)}")

    def _build_tone_instructions(self, tone: CoverLetterTone) -> str:
        """Build detailed tone instructions for the prompt."""
        style_guides = {
            'professional': """
- Balanced and measured language
- Focus on achievements and qualifications
- Formal but not stiff
- Example opening: "My experience in X positions me well to contribute to Y..."
""",
            'enthusiastic': """
- Energetic and forward-looking language
- Show genuine excitement about the opportunity
- Emphasize innovation and impact
- Use active, dynamic verbs
- Example opening: "When I discovered [Company] was solving [problem], I knew..."
""",
            'formal': """
- Highly professional, measured tone
- Emphasis on credentials and track record
- Conservative language choices
- Focus on leadership and strategic thinking
- Example opening: "With [X years] of experience in [field], I bring..."
""",
            'conversational': """
- Warm and personable while still professional
- Show personality and authentic voice
- Use storytelling techniques
- More casual transitions
- Example opening: "The first time I used [product], I thought..."
"""
        }

        traits_guidance = ""
        if tone.personality_traits:
            trait_details = {
                'analytical': "Include data points and logical progression of ideas",
                'collaborative': "Emphasize teamwork and cross-functional impact",
                'innovative': "Highlight creative solutions and novel approaches",
                'detail-oriented': "Be precise with metrics and specific examples",
                'leadership': "Focus on influence, mentorship, and team outcomes"
            }
            traits_list = [trait_details.get(t, t) for t in tone.personality_traits]
            traits_guidance = f"\n\nPERSONALITY EMPHASIS:\n- " + "\n- ".join(traits_list)

        return style_guides.get(tone.style, style_guides['professional']) + traits_guidance

    def _build_company_context(self, research: CompanyResearch) -> str:
        """Build company context section for the prompt."""
        parts = []

        if research.mission:
            parts.append(f"Mission: {research.mission}")

        if research.values:
            parts.append(f"Values: {', '.join(research.values)}")

        if research.industry:
            parts.append(f"Industry: {research.industry}")

        if research.company_size:
            parts.append(f"Company type: {research.company_size}")

        if research.culture_keywords:
            parts.append(f"Culture: {', '.join(research.culture_keywords)}")

        if research.recent_news:
            parts.append(f"Recent initiatives: {', '.join(research.recent_news[:3])}")

        if not parts:
            return "No specific company research available. Focus on job description content."

        return "\n".join(parts)

    def generate_cover_letter_variants(
            self,
            resume: ResumeData,
            job_description: str,
            company_name: str,
            position: str,
            num_variants: int = 2
    ) -> List[CoverLetter]:
        """
        Generate multiple cover letter variants for A/B testing.

        Creates variants with different tones or emphasis for comparison.

        Args:
            resume: Candidate's resume
            job_description: Job posting
            company_name: Target company
            position: Job title
            num_variants: Number of variants to generate (default: 2)

        Returns:
            List of CoverLetter objects
        """
        print(f"\n📝 Generating {num_variants} cover letter variants for A/B comparison...")

        # Gather shared research
        company_research = self.research_company(company_name, job_description)
        hiring_manager = self.find_hiring_manager(job_description, company_name)
        base_tone = self.determine_tone(job_description, company_research)

        variants = []
        version_labels = ['A', 'B', 'C', 'D'][:num_variants]

        # Define variant strategies
        variant_tones = [
            base_tone,  # A: Auto-detected tone
            CoverLetterTone(  # B: Slightly different style
                style='enthusiastic' if base_tone.style != 'enthusiastic' else 'professional',
                personality_traits=base_tone.personality_traits,
                industry_context=base_tone.industry_context
            )
        ]

        for i, version in enumerate(version_labels):
            tone = variant_tones[i] if i < len(variant_tones) else base_tone
            try:
                variant = self.generate_cover_letter(
                    resume=resume,
                    job_description=job_description,
                    company_name=company_name,
                    position=position,
                    tone=tone,
                    company_research=company_research,
                    hiring_manager=hiring_manager,
                    version=version
                )
                variants.append(variant)
            except Exception as e:
                print(f"  ⚠ Variant {version} generation failed: {e}")

        print(f"  ✓ Generated {len(variants)} cover letter variants")
        return variants

    def refine_cover_letter(
            self,
            cover_letter: CoverLetter,
            resume: ResumeData,
            job_description: str,
            feedback: Optional[str] = None
    ) -> CoverLetter:
        """
        Refine an existing cover letter based on quality review or user feedback.

        Args:
            cover_letter: Existing cover letter to refine
            resume: Candidate's resume for fact-checking
            job_description: Job posting for alignment
            feedback: Optional specific feedback to address

        Returns:
            Refined CoverLetter object
        """
        print("\n🔄 Refining cover letter...")

        current_text = "\n\n".join(cover_letter.paragraphs)

        # Auto-generate feedback if not provided
        if not feedback:
            feedback = self._review_cover_letter(cover_letter, job_description)

        prompt = f"""Refine this cover letter based on the feedback provided.

=== CURRENT COVER LETTER ===
Dear {cover_letter.hiring_manager},

{current_text}

=== REFINEMENT FEEDBACK ===
{feedback}

=== JOB DESCRIPTION (for alignment) ===
{job_description[:2000]}

=== CANDIDATE RESUME (for fact-checking) ===
{resume.to_text()[:2000]}

=== REFINEMENT INSTRUCTIONS ===
1. Address each point in the feedback
2. Maintain the overall structure (4 paragraphs)
3. Keep the same tone and style
4. Ensure all claims are still backed by resume evidence
5. Stay under 400 words total

=== OUTPUT FORMAT ===
Return ONLY valid JSON:
{{
  "paragraphs": ["refined opening...", "refined body1...", "refined body2...", "refined closing..."],
  "company_name": "{cover_letter.company_name}",
  "position": "{cover_letter.position}",
  "hiring_manager": "{cover_letter.hiring_manager}"
}}

JSON:"""

        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            json_text = self._extract_json(response.content)
            data = json.loads(json_text)

            # Preserve tone and mark as refined
            data['tone'] = cover_letter.tone.model_dump() if cover_letter.tone else None
            data['version'] = cover_letter.version + "-refined"

            refined = CoverLetter(**data)
            word_count = len(' '.join(refined.paragraphs).split())
            print(f"  ✓ Cover letter refined ({word_count} words)")
            return refined

        except Exception as e:
            print(f"  ⚠ Refinement failed: {e}, returning original")
            return cover_letter

    def _review_cover_letter(self, cover_letter: CoverLetter, job_description: str) -> str:
        """Generate quality review feedback for cover letter."""

        current_text = "\n\n".join(cover_letter.paragraphs)

        prompt = f"""Review this cover letter and provide specific improvement feedback.

=== COVER LETTER ===
{current_text}

=== JOB DESCRIPTION ===
{job_description[:2000]}

=== REVIEW CHECKLIST ===
1. Opening hook - Is it specific and compelling?
2. Company personalization - Does it mention the company specifically?
3. Evidence quality - Are achievements quantified?
4. Job alignment - Does it address key requirements?
5. Tone consistency - Is the tone appropriate and consistent?
6. Generic phrases - Are there any clichés to remove?
7. Call to action - Is the closing specific?

Return 3-5 specific, actionable improvements in a bulleted list.
Format: "- [Issue]: [Specific suggestion]"
"""

        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            return response.content
        except Exception:
            return "- Strengthen the opening hook with a more specific achievement\n- Add more quantified results\n- Make the closing more specific to the role"

    def _extract_priority_keywords(self, job_description: str) -> List[str]:
        """
        Explicitly extract high-impact keywords from job description.

        Uses pattern matching + LLM for comprehensive extraction.
        Returns prioritized list of keywords to emphasize in resume.
        """
        # Quick pattern-based extraction for common high-value terms
        import re

        # Technical skills patterns
        tech_patterns = [
            r'\b(Python|Java|JavaScript|TypeScript|Go|Rust|C\+\+|Ruby|Scala|Kotlin)\b',
            r'\b(React|Angular|Vue|Node\.js|Django|Flask|Spring|Rails)\b',
            r'\b(AWS|Azure|GCP|Kubernetes|Docker|Terraform|Jenkins|CI/CD)\b',
            r'\b(SQL|PostgreSQL|MySQL|MongoDB|Redis|Elasticsearch|Kafka)\b',
            r'\b(Machine Learning|ML|AI|Deep Learning|NLP|Computer Vision)\b',
            r'\b(REST|GraphQL|microservices|APIs?|distributed systems?)\b',
            r'\b(Agile|Scrum|DevOps|SRE|TDD|BDD)\b',
        ]

        # Experience/soft skill patterns
        soft_patterns = [
            r'\b(lead(?:ing|ership)?|mentor(?:ing)?|manage(?:ment)?)\b',
            r'\b(cross-functional|collaborate|stakeholder)\b',
            r'\b(scale|scaling|performance|optimization)\b',
            r'\b(architect(?:ure)?|design(?:ing)?|system design)\b',
        ]

        extracted = set()
        text_lower = job_description.lower()

        for pattern in tech_patterns + soft_patterns:
            matches = re.findall(pattern, job_description, re.IGNORECASE)
            extracted.update(m if isinstance(m, str) else m[0] for m in matches)

        # Also extract explicit requirements (lines starting with - or •)
        requirement_lines = re.findall(r'[-•]\s*(.+?)(?:\n|$)', job_description)
        for line in requirement_lines[:10]:
            # Extract key noun phrases
            words = line.split()
            if len(words) <= 5:
                extracted.add(line.strip())

        # Prioritize: more frequent = higher priority
        keyword_freq = {}
        for kw in extracted:
            keyword_freq[kw] = text_lower.count(kw.lower())

        # Sort by frequency, then alphabetically
        sorted_keywords = sorted(
            extracted,
            key=lambda x: (-keyword_freq.get(x, 0), x.lower())
        )

        return sorted_keywords[:20]

    def review_and_refine(
        self,
        tailored_resume: ResumeData,
        job_description: str,
        iteration: int = 1
    ) -> Tuple[ResumeData, Dict]:
        """
        Review tailored resume and refine if needed (iterative improvement).

        Args:
            tailored_resume: Previously tailored resume
            job_description: Target job
            iteration: Current iteration number (1-based)

        Returns:
            Tuple of (refined_resume, review_feedback)
        """
        if iteration > MAX_REFINEMENT_ITERATIONS:
            return tailored_resume, {"status": "max_iterations_reached"}

        print(f"\n🔄 Refinement iteration {iteration}/{MAX_REFINEMENT_ITERATIONS}...")

        resume_text = tailored_resume.to_text()
        original_data = json.loads(tailored_resume.json())
        extracted_keywords = self._extract_priority_keywords(job_description)

        prompt = f"""You are a resume quality reviewer. Analyze this tailored resume and suggest refinements.

=== PRIORITY KEYWORDS (should be present) ===
{', '.join(extracted_keywords[:15])}

=== JOB DESCRIPTION ===
{job_description[:CONTEXT_JOB_DESCRIPTION]}

=== TAILORED RESUME ===
{resume_text[:CONTEXT_RESUME_TEXT]}

=== REVIEW CHECKLIST ===
1. KEYWORD COVERAGE: Are priority keywords present naturally?
2. QUANTIFICATION: Do bullets have metrics where possible?
3. ACTION VERBS: Does each bullet start with strong action verb?
4. RELEVANCE: Are the most relevant experiences highlighted?
5. ATS READINESS: Will this pass ATS keyword scanning?

=== OUTPUT FORMAT ===
Return JSON:
{{
  "score": 85,  // Overall quality score 0-100
  "keyword_coverage": 0.75,  // Fraction of priority keywords present
  "missing_keywords": ["keyword1", "keyword2"],  // High-impact missing keywords
  "weak_bullets": [
    {{"location": "Experience 1, bullet 2", "issue": "lacks metrics", "suggestion": "Add specific numbers"}}
  ],
  "strengths": ["Good action verbs", "Strong quantification in projects"],
  "needs_refinement": true,  // false if score >= 90
  "refinement_focus": "Add missing keywords X and Y, quantify bullet Z"
}}

JSON:"""

        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            json_text = self._extract_json(response.content)
            review = json.loads(json_text)

            print(f"  📊 Quality score: {review.get('score', 'N/A')}/100")
            print(f"  📊 Keyword coverage: {review.get('keyword_coverage', 0):.0%}")

            # If score is good enough, no refinement needed
            if review.get('score', 0) >= 90 or not review.get('needs_refinement', False):
                print("  ✓ Resume quality is good, no refinement needed")
                return tailored_resume, review

            # Otherwise, refine based on feedback
            print(f"  🔧 Refining: {review.get('refinement_focus', 'general improvements')}")

            refined = self._apply_refinements(
                tailored_resume,
                job_description,
                review,
                extracted_keywords
            )

            review['refined'] = True
            return refined, review

        except Exception as e:
            print(f"  ⚠ Review failed: {e}")
            return tailored_resume, {"status": "error", "message": str(e)}

    def _apply_refinements(
        self,
        resume: ResumeData,
        job_description: str,
        review_feedback: Dict,
        keywords: List[str]
    ) -> ResumeData:
        """Apply specific refinements based on review feedback."""

        original_data = json.loads(resume.json())
        missing_keywords = review_feedback.get('missing_keywords', [])[:5]
        weak_bullets = review_feedback.get('weak_bullets', [])[:5]

        prompt = f"""Apply targeted refinements to this resume based on review feedback.

=== REFINEMENT INSTRUCTIONS ===
Focus: {review_feedback.get('refinement_focus', 'general improvement')}

Missing Keywords to Add (naturally): {', '.join(missing_keywords)}

Weak Bullets to Fix:
{json.dumps(weak_bullets, indent=2)}

=== CURRENT RESUME (JSON) ===
{json.dumps(original_data, indent=2)[:CONTEXT_RESUME_JSON]}

=== CONSTRAINTS ===
- ONLY modify the specific weak bullets identified
- Add missing keywords ONLY where they fit naturally
- Preserve ALL structure (same number of experiences/projects)
- Preserve ALL identity info (titles, companies, names, dates)

Return the complete refined JSON. Start with {{"header":

JSON:"""

        try:
            # Use slightly higher temperature for creative refinements
            response = self.llm.invoke([HumanMessage(content=prompt)])
            json_text = self._extract_json(response.content)
            data = json.loads(json_text)

            # Validation (same as tailor_resume)
            for key in ['header', 'education', 'experience', 'projects', 'skills']:
                if key not in data:
                    data[key] = original_data[key]

            if len(data['experience']) != len(original_data['experience']):
                data['experience'] = original_data['experience']

            if len(data['projects']) != len(original_data['projects']):
                data['projects'] = original_data['projects']

            return ResumeData(**data)

        except Exception as e:
            print(f"  ⚠ Refinement application failed: {e}")
            return resume

    def _extract_json(self, text: str) -> str:
        """Extract JSON from potentially markdown-wrapped response"""
        text = text.strip()

        if "```json" in text:
            start = text.find("```json") + 7
            end = text.find("```", start)
            return text[start:end].strip()
        elif "```" in text:
            start = text.find("```") + 3
            end = text.find("```", start)
            return text[start:end].strip()

        return text

    # ============================================================
    # RICH SEMANTIC ANALYSIS USAGE
    # ============================================================

    def _build_rich_semantic_context(self, semantic_analysis: SemanticAnalysisResult) -> str:
        """
        Build comprehensive semantic analysis context for LLM prompts.

        Includes full gaps, matches, weak matches with severity levels
        to enable targeted resume enhancement.
        """
        sections = []

        # Overall metrics
        sections.append(f"""
=== SEMANTIC ANALYSIS RESULTS ===
Overall Match Score: {semantic_analysis.overall_match:.1%}
Coverage: {semantic_analysis.coverage:.1%} of job requirements matched
Strong Matches: {len(semantic_analysis.matches)}
Gaps Found: {len([g for g in semantic_analysis.gaps if g.get('status') == 'missing'])}
Weak Matches: {len([g for g in semantic_analysis.gaps if g.get('status') == 'weak'])}
""")

        # High-severity gaps (completely missing skills)
        high_severity_gaps = [g for g in semantic_analysis.gaps
                             if g.get('status') == 'missing' and g.get('severity') == 'high']
        if high_severity_gaps:
            sections.append("\n=== CRITICAL GAPS (High Priority - Missing Skills) ===")
            for i, gap in enumerate(high_severity_gaps[:5], 1):
                sections.append(f"""
Gap {i}: "{gap.get('job_requirement', 'Unknown')[:100]}"
  - Similarity to best resume match: {gap.get('similarity', 0):.1%}
  - Best current match: "{gap.get('best_match', 'None')[:80]}"
  - ACTION: Need to add or significantly strengthen this skill
""")

        # Medium-severity gaps
        medium_gaps = [g for g in semantic_analysis.gaps
                      if g.get('status') == 'missing' and g.get('severity') == 'medium']
        if medium_gaps:
            sections.append("\n=== MODERATE GAPS (Medium Priority) ===")
            for i, gap in enumerate(medium_gaps[:3], 1):
                sections.append(f"""
Gap {i}: "{gap.get('job_requirement', 'Unknown')[:100]}"
  - Current similarity: {gap.get('similarity', 0):.1%}
  - Closest match: "{gap.get('best_match', 'None')[:80]}"
""")

        # Weak matches (have something but could be stronger)
        weak_matches = [g for g in semantic_analysis.gaps if g.get('status') == 'weak']
        if weak_matches:
            sections.append("\n=== WEAK MATCHES (Enhancement Opportunities) ===")
            sections.append("These are areas where you have SOME coverage but could strengthen:")
            for i, weak in enumerate(weak_matches[:5], 1):
                similarity = weak.get('similarity', 0)
                sections.append(f"""
Weak Match {i}: "{weak.get('job_requirement', 'Unknown')[:100]}"
  - Current similarity: {similarity:.1%} (target: 75%+)
  - Your current bullet: "{weak.get('best_match', 'None')[:80]}"
  - OPPORTUNITY: Rewrite this bullet to boost similarity from {similarity:.0%} to 80%+
""")

        # Strong matches (what's working well)
        if semantic_analysis.matches:
            sections.append("\n=== STRONG MATCHES (Keep These) ===")
            for i, match in enumerate(semantic_analysis.matches[:5], 1):
                sections.append(f"""
Match {i}: "{match.get('job_requirement', 'Unknown')[:80]}"
  - Similarity: {match.get('similarity', 0):.1%}
  - Your evidence: "{match.get('resume_evidence', 'None')[:80]}"
""")

        # Actionable summary
        sections.append(f"""
=== ENHANCEMENT STRATEGY ===
1. PRIORITY: Focus questions on the {len(high_severity_gaps)} critical gaps
2. QUICK WINS: Strengthen the {len(weak_matches)} weak matches by adding keywords/metrics
3. PRESERVE: Keep the {len(semantic_analysis.matches)} strong matches intact
4. TARGET: Aim to boost overall match from {semantic_analysis.overall_match:.0%} to 80%+
""")

        return "\n".join(sections)

    def suggest_skill_additions(
        self,
        resume: ResumeData,
        job_description: str,
        semantic_analysis: SemanticAnalysisResult
    ) -> Dict:
        """
        Suggest specific skills to add based on semantic gap analysis.

        Returns actionable suggestions with impact estimates.
        """
        print("\n💡 Generating skill addition suggestions...")

        # Identify highest-impact gaps
        critical_gaps = [g for g in semantic_analysis.gaps
                        if g.get('status') == 'missing' and g.get('severity') == 'high']

        weak_matches = [g for g in semantic_analysis.gaps if g.get('status') == 'weak']

        prompt = f"""Analyze these semantic gaps and suggest specific skill additions.

=== CURRENT RESUME SKILLS ===
Languages: {', '.join(resume.skills.languages)}
Frameworks: {', '.join(resume.skills.frameworks)}
Tools: {', '.join(resume.skills.tools)}

=== CRITICAL GAPS (skills completely missing) ===
{json.dumps([{
    'requirement': g.get('job_requirement', '')[:100],
    'similarity': g.get('similarity', 0)
} for g in critical_gaps[:5]], indent=2)}

=== WEAK MATCHES (skills present but underemphasized) ===
{json.dumps([{
    'requirement': g.get('job_requirement', '')[:100],
    'current_match': g.get('best_match', '')[:80],
    'similarity': g.get('similarity', 0)
} for g in weak_matches[:5]], indent=2)}

=== JOB DESCRIPTION ===
{job_description[:2000]}

=== TASK ===
Provide specific, actionable skill addition suggestions:

1. SKILLS TO ADD: Specific skills missing that the candidate likely has
2. SKILLS TO EMPHASIZE: Existing skills that need more visibility
3. BULLET REWRITES: Specific bullets to modify with exact suggested changes
4. IMPACT ESTIMATE: How much each change would improve the match

=== OUTPUT FORMAT ===
Return JSON:
{{
    "current_match_score": {semantic_analysis.overall_match:.2f},
    "estimated_new_score": 0.80,
    "skills_to_add": [
        {{"skill": "Kubernetes", "category": "tools", "reason": "Job requires container orchestration", "impact": "high"}}
    ],
    "skills_to_emphasize": [
        {{"skill": "Python", "current_mentions": 2, "suggested_mentions": 4, "where": "Add to project descriptions"}}
    ],
    "bullet_rewrites": [
        {{
            "location": "Experience 1, bullet 2",
            "current": "Improved system performance",
            "suggested": "Optimized Python microservices, reducing latency by 40% using Redis caching",
            "keywords_added": ["Python", "microservices", "Redis"],
            "similarity_boost": 0.25
        }}
    ],
    "quick_wins": ["Add Docker to tools", "Mention CI/CD in deployment bullets"]
}}

JSON:"""

        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            json_text = self._extract_json(response.content)
            suggestions = json.loads(json_text)

            print(f"  ✓ Generated {len(suggestions.get('skills_to_add', []))} skill additions")
            print(f"  ✓ Generated {len(suggestions.get('bullet_rewrites', []))} bullet rewrites")
            print(f"  ✓ Estimated score improvement: {semantic_analysis.overall_match:.0%} → {suggestions.get('estimated_new_score', 0):.0%}")

            return suggestions

        except Exception as e:
            print(f"  ⚠ Skill suggestion failed: {e}")
            return {"error": str(e)}

    def reorder_resume_sections(
        self,
        resume: ResumeData,
        job_description: str,
        semantic_analysis: SemanticAnalysisResult
    ) -> ResumeData:
        """
        Reorder resume sections to put most relevant content first.

        Uses semantic analysis to determine which experiences/projects
        are most relevant to the job.
        """
        print("\n🔄 Optimizing section order based on relevance...")

        # Score each experience based on semantic matches
        experience_scores = []
        for i, exp in enumerate(resume.experience):
            exp_text = f"{exp.title} at {exp.company}: " + " ".join(exp.bullets)
            score = self._calculate_relevance_score(exp_text, semantic_analysis)
            experience_scores.append((i, score, exp))

        # Score each project
        project_scores = []
        for i, proj in enumerate(resume.projects):
            proj_text = f"{proj.name} ({', '.join(proj.technologies)}): " + " ".join(proj.bullets)
            score = self._calculate_relevance_score(proj_text, semantic_analysis)
            project_scores.append((i, score, proj))

        # Sort by relevance score (highest first)
        experience_scores.sort(key=lambda x: x[1], reverse=True)
        project_scores.sort(key=lambda x: x[1], reverse=True)

        # Check if reordering would help
        exp_needs_reorder = experience_scores[0][0] != 0 if experience_scores else False
        proj_needs_reorder = project_scores[0][0] != 0 if project_scores else False

        if not exp_needs_reorder and not proj_needs_reorder:
            print("  ✓ Current order is already optimal")
            return resume

        # Create reordered resume
        reordered_data = json.loads(resume.model_dump_json())

        if exp_needs_reorder:
            reordered_data['experience'] = [exp.model_dump() for _, _, exp in experience_scores]
            print(f"  ✓ Reordered experiences (most relevant: {experience_scores[0][2].title})")

        if proj_needs_reorder:
            reordered_data['projects'] = [proj.model_dump() for _, _, proj in project_scores]
            print(f"  ✓ Reordered projects (most relevant: {project_scores[0][2].name})")

        return ResumeData(**reordered_data)

    def _calculate_relevance_score(self, text: str, semantic_analysis: SemanticAnalysisResult) -> float:
        """Calculate relevance score for a text block based on semantic matches."""
        text_lower = text.lower()
        score = 0.0

        # Check matches - each match found in this text adds to score
        for match in semantic_analysis.matches:
            evidence = match.get('resume_evidence', '').lower()
            if evidence and evidence[:50] in text_lower:
                score += match.get('similarity', 0) * 2  # Bonus for strong matches

        # Check for matching skills
        for skill in semantic_analysis.top_matching_skills:
            if skill.lower() in text_lower:
                score += 0.5

        # Check for gap-filling potential
        for gap in semantic_analysis.gaps:
            best_match = gap.get('best_match', '').lower()
            if best_match and best_match[:50] in text_lower:
                # This section addresses a gap
                score += (1 - gap.get('similarity', 0)) * 0.5

        return score

    def get_semantic_enhancement_plan(
        self,
        resume: ResumeData,
        job_description: str,
        semantic_analysis: SemanticAnalysisResult
    ) -> Dict:
        """
        Generate a comprehensive enhancement plan using semantic analysis.

        Combines all semantic-driven improvements into an actionable plan.
        """
        print("\n📋 Generating semantic enhancement plan...")

        plan = {
            "current_score": semantic_analysis.overall_match,
            "target_score": 0.85,
            "coverage": semantic_analysis.coverage,
            "phases": []
        }

        # Phase 1: Critical gaps
        critical_gaps = [g for g in semantic_analysis.gaps
                        if g.get('status') == 'missing' and g.get('severity') == 'high']
        if critical_gaps:
            plan["phases"].append({
                "phase": 1,
                "name": "Address Critical Gaps",
                "priority": "high",
                "items": [
                    {
                        "gap": g.get('job_requirement', '')[:80],
                        "action": "Add missing skill/experience",
                        "current_similarity": g.get('similarity', 0)
                    }
                    for g in critical_gaps[:3]
                ]
            })

        # Phase 2: Strengthen weak matches
        weak_matches = [g for g in semantic_analysis.gaps if g.get('status') == 'weak']
        if weak_matches:
            plan["phases"].append({
                "phase": 2,
                "name": "Strengthen Weak Matches",
                "priority": "medium",
                "items": [
                    {
                        "requirement": g.get('job_requirement', '')[:80],
                        "current_bullet": g.get('best_match', '')[:60],
                        "current_similarity": g.get('similarity', 0),
                        "target_similarity": 0.80,
                        "action": "Rewrite with keywords and metrics"
                    }
                    for g in weak_matches[:5]
                ]
            })

        # Phase 3: Optimize structure
        plan["phases"].append({
            "phase": 3,
            "name": "Optimize Resume Structure",
            "priority": "low",
            "items": [
                {"action": "Reorder experiences by relevance"},
                {"action": "Reorder projects by relevance"},
                {"action": "Ensure strongest matches are visible above the fold"}
            ]
        })

        # Calculate estimated improvement
        gap_improvement = len(critical_gaps) * 0.05  # ~5% per gap addressed
        weak_improvement = len(weak_matches) * 0.02  # ~2% per weak match strengthened
        plan["estimated_final_score"] = min(0.95, semantic_analysis.overall_match + gap_improvement + weak_improvement)

        print(f"  ✓ Plan generated: {len(plan['phases'])} phases")
        print(f"  ✓ Estimated improvement: {semantic_analysis.overall_match:.0%} → {plan['estimated_final_score']:.0%}")

        return plan