"""
Resume parsing module.
Handles PDF extraction and LLM-based structure parsing.
"""

import json
import re
from typing import Optional, List
from langchain_community.document_loaders import PyPDFLoader
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from .models import ResumeData
from .config import GEMINI_API_KEY, GEMINI_MODEL, GEMINI_TEMPERATURE, GEMINI_TIMEOUT, GEMINI_MAX_RETRIES


class ResumeParser:
    """
    Handles extraction and parsing of resume PDFs.
    
    Responsibilities:
    - Extract text from PDF files
    - Parse unstructured text into structured ResumeData
    - Handle parsing errors gracefully
    """
    
    def __init__(self):
        """Initialize LLM for parsing"""
        self.llm = ChatGoogleGenerativeAI(
            model=GEMINI_MODEL,
            temperature=GEMINI_TEMPERATURE,
            google_api_key=GEMINI_API_KEY,
            request_timeout=GEMINI_TIMEOUT,
            max_retries=GEMINI_MAX_RETRIES
        )
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """
        Extract all text from a PDF file.
        Also handles DOCX files by extracting text directly.
        
        Args:
            pdf_path: Path to PDF or DOCX file
            
        Returns:
            Extracted text as string
            
        Raises:
            FileNotFoundError: If file doesn't exist
            Exception: If file is corrupted or unreadable
        """
        print(f"\n📄 Extracting text from {pdf_path}...")
        
        try:
            # Check if it's a DOCX file
            from pathlib import Path as PathlibPath
            file_ext = PathlibPath(pdf_path).suffix.lower()
            
            if file_ext in ['.docx', '.doc']:
                print(f"  📋 Detected {file_ext} file, extracting text directly...")
                from docx import Document
                doc = Document(pdf_path)
                text = "\n".join([p.text for p in doc.paragraphs])
                print(f"  ✓ Extracted {len(text)} characters from DOCX")
                return text
            
            # Handle PDF files
            loader = PyPDFLoader(pdf_path)
            pages = loader.load()
            text = "\n".join([p.page_content for p in pages])
            
            print(f"  ✓ Extracted {len(text)} characters from {len(pages)} pages")
            return text
            
        except FileNotFoundError:
            raise FileNotFoundError(f"File not found: {pdf_path}")
        except Exception as e:
            raise Exception(f"Failed to extract text: {str(e)}")
    
    def parse_resume_text(self, resume_text: str) -> ResumeData:
        """
        Parse unstructured resume text into structured ResumeData.
        
        Uses LLM to intelligently extract:
        - Contact information
        - Education entries
        - Work experience with bullets
        - Projects
        - Skills (categorized)
        
        Args:
            resume_text: Raw text from resume
            
        Returns:
            ResumeData object
            
        Raises:
            ValueError: If parsing fails or required fields missing
        """
        print("\n🔍 Parsing resume structure...")
        
        prompt = f"""Extract information from this resume into valid JSON.

SCHEMA:
{{
  "header": {{"name": "str", "email": "str", "phone": "str|null", "linkedin": "str|null", "github": "str|null", "location": "str|null"}},
  "education": [{{"degree": "str", "school": "str", "graduation_date": "str", "location": "str", "gpa": "float|null"}}],
  "experience": [{{"title": "str", "company": "str", "start_date": "str", "end_date": "str", "location": "str", "bullets": ["str"]}}],
  "projects": [{{"name": "str", "technologies": ["str"], "bullets": ["str"], "dates": "str|null", "link": "str|null"}}],
  "skills": {{"languages": ["str"], "frameworks": ["str"], "tools": ["str"], "other": ["str"]}}
}}

🚨 CRITICAL RULES - EXTRACT ONLY WHAT IS EXPLICITLY WRITTEN 🚨

1. ONLY extract skills that are LITERALLY written in the resume text
   - DO NOT infer or guess skills
   - DO NOT add skills based on job titles or bullet points
   - If skills section says "Excel, PowerPoint" → only include "Excel, PowerPoint"
   - If no programming languages are listed → languages should be empty []

2. For skills categorization:
   - languages: ONLY programming languages EXPLICITLY listed (NOT spoken languages like English/Hindi)
   - frameworks: ONLY frameworks EXPLICITLY listed
   - tools: ONLY tools EXPLICITLY listed
   - other: Any other skills that don't fit above categories

3. Extract EXACT text - don't rephrase bullet points

4. Keep all dates as written

5. If a skill is NOT explicitly written in the resume, DO NOT include it
   - Example: If resume says "Created reports in Excel" but doesn't list Excel as a skill,
     DO NOT add Excel to skills. Only add it if it appears in a "Skills" section.

6. Use null for missing optional fields

7. Return ONLY valid JSON, no markdown code blocks

8. Spoken languages (English, Hindi, etc.) go in "other", NOT in "languages"

Resume:
{resume_text}

JSON:"""

        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            json_text = self._extract_json(response.content)
            data = json.loads(json_text)

            # CRITICAL: Extract the Skills section from the resume for validation
            # Only skills that appear in the SKILLS SECTION should be included
            skills_section = self._extract_skills_section(resume_text)

            print(f"    📋 Skills section found: {len(skills_section)} characters")
            if skills_section:
                print(f"    📋 Skills text: {skills_section[:200]}...")

            if 'skills' in data:
                for category in ['languages', 'frameworks', 'tools', 'other']:
                    if category in data['skills'] and data['skills'][category]:
                        original_skills = data['skills'][category]
                        validated_skills = []
                        for skill in original_skills:
                            # Use strict validation - skill must be in Skills section
                            if self._skill_in_skills_section(skill, skills_section, resume_text):
                                validated_skills.append(skill)
                            else:
                                print(f"    ⚠️ REMOVING hallucinated skill '{skill}' - not found in Skills section")
                        data['skills'][category] = validated_skills

            # Validate and create ResumeData
            resume = ResumeData(**data)

            print(f"  ✓ Parsed: {len(resume.experience)} jobs, "
                  f"{len(resume.projects)} projects, "
                  f"{len(resume.education)} education entries")

            return resume
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse JSON from LLM response: {str(e)}")
        except Exception as e:
            raise ValueError(f"Resume parsing failed: {str(e)}")
    
    def parse_resume_from_pdf(self, pdf_path: str) -> ResumeData:
        """
        Convenience method: Extract and parse in one call.
        
        Args:
            pdf_path: Path to resume PDF
            
        Returns:
            ResumeData object
        """
        text = self.extract_text_from_pdf(pdf_path)
        return self.parse_resume_text(text)
    
    def _extract_json(self, text: str) -> str:
        """
        Extract JSON from LLM response that may contain markdown.

        LLMs often wrap JSON in ```json ... ``` blocks.
        This strips that formatting.
        """
        text = text.strip()

        # Remove markdown code blocks
        if "```json" in text:
            start = text.find("```json") + 7
            end = text.find("```", start)
            return text[start:end].strip()
        elif "```" in text:
            start = text.find("```") + 3
            end = text.find("```", start)
            return text[start:end].strip()

        return text

    def _extract_skills_section(self, resume_text: str) -> str:
        """
        Extract just the Skills section from the resume text.

        This ensures we only validate skills against the dedicated Skills section,
        not against bullet points or other parts of the resume.
        """
        text_lower = resume_text.lower()

        # Common variations of skills section headers
        skills_headers = [
            r'(?:^|\n)\s*(?:technical\s+)?skills?\s*[:|\n]',
            r'(?:^|\n)\s*(?:core\s+)?competenc(?:y|ies)\s*[:|\n]',
            r'(?:^|\n)\s*technologies?\s*[:|\n]',
            r'(?:^|\n)\s*technical\s+proficienc(?:y|ies)\s*[:|\n]',
            r'(?:^|\n)\s*programming\s+(?:languages?|skills?)\s*[:|\n]',
            r'(?:^|\n)\s*expertise\s*[:|\n]',
        ]

        skills_section = ""

        for pattern in skills_headers:
            match = re.search(pattern, text_lower)
            if match:
                start_pos = match.end()

                # Find the end of the skills section (next section header or end)
                next_section_patterns = [
                    r'\n\s*(?:experience|education|projects?|work\s+history|employment|certifications?|awards?|publications?|references?)\s*[:|\n]',
                ]

                end_pos = len(resume_text)
                for next_pattern in next_section_patterns:
                    next_match = re.search(next_pattern, text_lower[start_pos:])
                    if next_match:
                        end_pos = min(end_pos, start_pos + next_match.start())

                skills_section = resume_text[start_pos:end_pos].strip()
                break

        return skills_section

    def _skill_in_skills_section(self, skill: str, skills_section: str, full_text: str) -> bool:
        """
        Check if a skill genuinely appears in the resume's Skills section.

        Uses multiple validation strategies:
        1. Check if skill appears in the Skills section (priority)
        2. Use word boundary matching to avoid partial matches
        3. Handle common variations and aliases
        """
        skill_lower = skill.lower().strip()
        skills_section_lower = skills_section.lower()

        # If we found a skills section, ONLY validate against that
        if skills_section:
            # Word boundary match in skills section
            pattern = r'\b' + re.escape(skill_lower) + r'\b'
            if re.search(pattern, skills_section_lower):
                return True

            # Also check for skill appearing in a list context in skills section
            # This catches "Python, Java, JavaScript" style lists
            list_pattern = r'(?:^|[,;•|\n])\s*' + re.escape(skill_lower) + r'\s*(?:[,;•|\n]|$)'
            if re.search(list_pattern, skills_section_lower):
                return True

            # Check for common variations
            variations = self._get_skill_variations(skill_lower)
            for variant in variations:
                variant_pattern = r'\b' + re.escape(variant) + r'\b'
                if re.search(variant_pattern, skills_section_lower):
                    return True

            # Not found in skills section - REJECT
            return False

        # If no dedicated skills section found, be VERY conservative
        # Only accept if it appears as a standalone item in a list-like context
        full_text_lower = full_text.lower()

        # Must appear in a comma/bullet separated list context, not in a sentence
        list_pattern = r'(?:^|[,;•|\n])\s*' + re.escape(skill_lower) + r'\s*(?:[,;•|\n]|$)'
        if re.search(list_pattern, full_text_lower):
            return True

        # REJECT - skill not found in acceptable context
        return False

    def _get_skill_variations(self, skill: str) -> List[str]:
        """
        Get common variations/aliases for a skill name.
        """
        variations_map = {
            'javascript': ['js', 'javascript', 'ecmascript'],
            'typescript': ['ts', 'typescript'],
            'python': ['python', 'python3', 'py'],
            'cpp': ['c++', 'cpp'],
            'csharp': ['c#', 'csharp'],
            'golang': ['go', 'golang'],
            'postgresql': ['postgres', 'postgresql', 'psql'],
            'mongodb': ['mongo', 'mongodb'],
            'kubernetes': ['k8s', 'kubernetes'],
            'amazon web services': ['aws', 'amazon web services'],
            'google cloud platform': ['gcp', 'google cloud', 'google cloud platform'],
            'microsoft azure': ['azure', 'microsoft azure'],
            'node.js': ['node', 'nodejs', 'node.js'],
            'react.js': ['react', 'reactjs', 'react.js'],
            'vue.js': ['vue', 'vuejs', 'vue.js'],
            'next.js': ['next', 'nextjs', 'next.js'],
        }

        # Return variations for this skill
        for key, variants in variations_map.items():
            if skill in variants:
                return [v for v in variants if v != skill]

        return []
