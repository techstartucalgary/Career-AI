"""
Pydantic models for request/response validation
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any


class Demographics(BaseModel):
    sex: Optional[str] = None
    gender: Optional[str] = None
    disability: Optional[str] = None
    race: Optional[str] = None


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    demographics: Optional[Demographics] = None
    
    # TODO: Re-enable when frontend collects these fields
    # first_name: str
    # last_name: str
    # phone: str
    # linkedin: str
    # github: str
    # location: str
    # indigenous: str
    # disability: str
    # lgbtq: str
    # minority: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    display_name: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None


class PreferencesUpdateRequest(BaseModel):
    positions: Optional[List[str]] = None
    locations: Optional[List[str]] = None
    work_arrangement: Optional[str] = None


class ResumeUpdateRequest(BaseModel):
    resume_file_name: Optional[str] = None
    extracted_data: Optional[Dict[str, Any]] = None


class OnboardingCompleteRequest(BaseModel):
    first_name: str
    last_name: str
    phone: str
    linkedin: str
    github: Optional[str] = None
    website: Optional[str] = None
    location: str
    positions: List[str]
    locations: List[str]
    work_arrangement: str


class DemographicsUpdateRequest(BaseModel):
    sex: Optional[str] = None
    gender: Optional[str] = None
    disability: Optional[str] = None
    race: Optional[str] = None
