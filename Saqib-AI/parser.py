"""
Resume parsing module.
Handles PDF extraction and LLM-based structure parsing.
"""

import json
from typing import Optional
from langchain_community.document_loaders import PyPDFLoader
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from models import ResumeData
from config import GEMINI_API_KEY, GEMINI_MODEL, GEMINI_TEMPERATURE, GEMINI_TIMEOUT, GEMINI_MAX_RETRIES


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
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            Extracted text as string
            
        Raises:
            FileNotFoundError: If PDF doesn't exist
            Exception: If PDF is corrupted or unreadable
        """
        print(f"\n📄 Extracting text from {pdf_path}...")
        
        try:
            loader = PyPDFLoader(pdf_path)
            pages = loader.load()
            text = "\n".join([p.page_content for p in pages])
            
            print(f"  ✓ Extracted {len(text)} characters from {len(pages)} pages")
            return text
            
        except FileNotFoundError:
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        except Exception as e:
            raise Exception(f"Failed to extract PDF text: {str(e)}")
    
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
        
        prompt = f"""Extract ALL information from this resume into valid JSON matching this schema:

{{
  "header": {{"name": "str", "email": "str", "phone": "str|null", "linkedin": "str|null", "github": "str|null", "location": "str|null"}},
  "education": [{{"degree": "str", "school": "str", "graduation_date": "str", "location": "str", "gpa": "float|null"}}],
  "experience": [{{"title": "str", "company": "str", "start_date": "str", "end_date": "str", "location": "str", "bullets": ["str"]}}],
  "projects": [{{"name": "str", "technologies": ["str"], "bullets": ["str"], "dates": "str|null", "link": "str|null"}}],
  "skills": {{"languages": ["str"], "frameworks": ["str"], "tools": ["str"], "other": ["str"]}}
}}

CRITICAL RULES:
1. Extract EXACT text - don't rephrase bullet points
2. Keep all dates as written (e.g., "May 2021", "Jul 2021 – Present")
3. Categorize skills correctly:
   - languages: Python, Java, JavaScript, C++, etc.
   - frameworks: React, Django, Flask, Node.js, etc.
   - tools: Git, Docker, AWS, MongoDB, etc.
   - other: Libraries like NumPy, Pandas, TensorFlow
4. If location in header exists, include it
5. Use null for missing optional fields
6. Return ONLY valid JSON, no markdown code blocks

Resume:
{resume_text}

JSON:"""

        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            json_text = self._extract_json(response.content)
            data = json.loads(json_text)
            
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
