"""
Data models for resume components.
All Pydantic models for type safety and validation.
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional


class Header(BaseModel):
    """Contact information for resume header"""
    name: str
    email: str
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    location: Optional[str] = None

    @validator('email')
    def validate_email(cls, v):
        if '@' not in v:
            raise ValueError('Invalid email address')
        return v

    def get_missing_contact_info(self) -> List[str]:
        """
        Check which important contact fields are missing.

        Returns:
            List of missing field names (email, phone, linkedin)
        """
        missing = []
        if not self.email or self.email.strip() == "":
            missing.append("email")
        if not self.phone or self.phone.strip() == "":
            missing.append("phone")
        if not self.linkedin or self.linkedin.strip() == "":
            missing.append("linkedin")
        return missing

    def has_complete_contact_info(self) -> bool:
        """Check if all important contact fields are present."""
        return len(self.get_missing_contact_info()) == 0


class Education(BaseModel):
    """Education entry"""
    degree: str
    school: str
    graduation_date: str
    location: Optional[str] = ""
    gpa: Optional[float] = None

    @validator('gpa')
    def validate_gpa(cls, v):
        if v is not None and (v < 0 or v > 4.0):
            raise ValueError('GPA must be between 0 and 4.0')
        return v


class Experience(BaseModel):
    """Work experience entry"""
    title: str
    company: str
    start_date: str
    end_date: str
    location: Optional[str] = ""
    bullets: List[str]

    @validator('bullets')
    def validate_bullets(cls, v):
        if not v:
            raise ValueError('Experience must have at least one bullet point')
        return v


class Project(BaseModel):
    """Project entry"""
    name: str
    technologies: List[str]
    bullets: List[str]
    dates: Optional[str] = None
    link: Optional[str] = None


class Skills(BaseModel):
    """Technical skills categorized"""
    languages: List[str] = []
    frameworks: List[str] = []
    tools: List[str] = []
    other: List[str] = []


class CoverLetterTone(BaseModel):
    """Tone settings for cover letter"""
    style: str = "professional"  # professional, conversational, enthusiastic, formal
    personality_traits: List[str] = []  # e.g., ["analytical", "creative", "collaborative"]
    industry_context: Optional[str] = None  # startup, enterprise, creative, technical


class CoverLetter(BaseModel):
    """Cover letter data"""
    paragraphs: List[str]
    company_name: str
    hiring_manager: Optional[str] = "Hiring Manager"
    position: str
    tone: Optional[CoverLetterTone] = None
    version: str = "A"  # For A/B testing

    def to_text(self) -> str:
        """Format as plain text"""
        header = f"{self.company_name}\n{self.position}\n\n"
        body = "\n\n".join(self.paragraphs)
        return header + body


class CompanyResearch(BaseModel):
    """Company research data pulled from web"""
    company_name: str
    mission: Optional[str] = None
    values: List[str] = []
    recent_news: List[str] = []
    culture_keywords: List[str] = []
    industry: Optional[str] = None
    company_size: Optional[str] = None
    founded: Optional[str] = None


class ResumeData(BaseModel):
    """Complete resume structure"""
    header: Header
    education: List[Education]
    experience: List[Experience]
    projects: List[Project]
    skills: Skills

    def to_text(self) -> str:
        """Convert to plain text for LLM processing"""
        sections = []

        # Header
        contact = f"{self.header.name}\n{self.header.email}"
        if self.header.phone:
            contact += f" | {self.header.phone}"
        if self.header.linkedin:
            contact += f" | {self.header.linkedin}"
        if self.header.github:
            contact += f" | {self.header.github}"
        sections.append(contact)

        # Education
        if self.education:
            sections.append("\nEDUCATION")
            for edu in self.education:
                sections.append(f"{edu.degree} - {edu.school} ({edu.graduation_date})")

        # Experience
        if self.experience:
            sections.append("\nEXPERIENCE")
            for exp in self.experience:
                sections.append(f"\n{exp.title} at {exp.company} ({exp.start_date} - {exp.end_date})")
                for bullet in exp.bullets:
                    sections.append(f"  • {bullet}")

        # Projects
        if self.projects:
            sections.append("\nPROJECTS")
            for proj in self.projects:
                tech = " | ".join(proj.technologies)
                sections.append(f"\n{proj.name} ({tech})")
                for bullet in proj.bullets:
                    sections.append(f"  • {bullet}")

        # Skills
        if self.skills:
            sections.append("\nSKILLS")
            if self.skills.languages:
                sections.append(f"Languages: {', '.join(self.skills.languages)}")
            if self.skills.frameworks:
                sections.append(f"Frameworks: {', '.join(self.skills.frameworks)}")
            if self.skills.tools:
                sections.append(f"Tools: {', '.join(self.skills.tools)}")

        return "\n".join(sections)


class SemanticAnalysisResult(BaseModel):
    """Result from semantic matching analysis"""
    overall_match: float
    coverage: float
    gaps: List[dict]
    matches: List[dict]
    top_missing_skills: List[str] = []
    top_matching_skills: List[str] = []
