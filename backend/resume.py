"""
Resume handling routes (parse, upload, update)
"""
from fastapi import APIRouter, Header, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
import tempfile
from pathlib import Path
from datetime import datetime

from models import ResumeUpdateRequest
from database import col
from dependencies import get_current_user

router = APIRouter()


@router.put("/resume")
def update_resume(payload: ResumeUpdateRequest, authorization: str = Header(None)):
    """Update resume metadata"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.split(" ", 1)[1]
    try:
        user_id = get_current_user(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    updates = {k: v for k, v in payload.dict().items() if v is not None}
    if not updates:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "No resume data provided."
            }
        )

    try:
        col.update_one({"_id": user_id}, {"$set": {f"resume.{k}": v for k, v in updates.items()}})
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Resume saved."
            }
        )
    except Exception as e:
        print(f"Resume save error: {str(e)}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Server side error!"
            }
        )


@router.post("/resume/parse")
async def parse_resume_file(
    resume_file: UploadFile = File(...),
    authorization: str = Header(None)
):
    """Parse resume file and extract structured data"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.split(" ", 1)[1]
    try:
        user_id = get_current_user(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    try:
        # Import here to avoid circular imports
        from ai_service.service import ResumeTailoringService
        from ai_service.parser import ResumeParser
        import base64
        
        # Create temp file
        temp_dir = tempfile.gettempdir()
        temp_file_path = Path(temp_dir) / f"resume_{datetime.now().timestamp()}.pdf"
        
        # Write uploaded file to temp location
        with open(temp_file_path, "wb") as buffer:
            buffer.write(await resume_file.read())
        
        # Parse resume
        parser = ResumeParser()
        resume_text = parser.extract_text_from_pdf(str(temp_file_path))
        parsed_resume = parser.parse_resume_text(resume_text)
        
        # Extract header info
        header = parsed_resume.header
        
        # Prepare extracted data for response
        extracted_data = {
            "name": header.name or "",
            "email": header.email or "",
            "phone": header.phone or "",
            "linkedin": header.linkedin or "",
            "github": header.github or "",
            "location": header.location or "",
        }
        
        # Parse first/last name from full name
        name_parts = (header.name or "").strip().split(maxsplit=1)
        first_name = name_parts[0] if name_parts else ""
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        
        # Auto-save to user profile
        if first_name or last_name:
            display_name = f"{first_name} {last_name}".strip()
            update_data = {
                "profile.display_name": display_name,
                "profile.first_name": first_name,
                "profile.last_name": last_name,
            }
            
            if header.phone:
                update_data["profile.phone"] = header.phone
            if header.linkedin:
                update_data["profile.linkedin"] = header.linkedin
            if header.github:
                update_data["profile.github"] = header.github
            if header.location:
                update_data["profile.location"] = header.location
            
            # Save resume file as base64
            with open(temp_file_path, "rb") as f:
                resume_bytes = f.read()
                resume_base64 = base64.b64encode(resume_bytes).decode("utf-8")
            
            update_data["resume.file_name"] = resume_file.filename
            update_data["resume.file_data"] = resume_base64
            update_data["resume.uploaded_at"] = datetime.utcnow().isoformat()
            
            col.update_one({"_id": user_id}, {"$set": update_data})
        
        # Clean up temp file
        try:
            Path(temp_file_path).unlink()
        except:
            pass
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": extracted_data
            }
        )
    
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": f"Resume parsing failed: {str(e)}"
            }
        )


@router.post("/resume/upload")
async def upload_resume_file(
    resume_file: UploadFile = File(...),
    authorization: str = Header(None)
):
    """Upload resume file without parsing or auto-filling profile"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.split(" ", 1)[1]
    try:
        user_id = get_current_user(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    try:
        import base64
        
        # Create temp file
        temp_dir = tempfile.gettempdir()
        temp_file_path = Path(temp_dir) / f"resume_{datetime.now().timestamp()}.pdf"
        
        # Write uploaded file to temp location
        with open(temp_file_path, "wb") as buffer:
            buffer.write(await resume_file.read())
        
        # Save resume file as base64
        with open(temp_file_path, "rb") as f:
            resume_bytes = f.read()
            resume_base64 = base64.b64encode(resume_bytes).decode("utf-8")
        
        # Store without parsing or auto-fill
        update_data = {
            "resume.file_name": resume_file.filename,
            "resume.file_data": resume_base64,
            "resume.uploaded_at": datetime.utcnow().isoformat()
        }
        
        col.update_one({"_id": user_id}, {"$set": update_data})
        
        # Clean up temp file
        try:
            Path(temp_file_path).unlink()
        except:
            pass
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Resume uploaded successfully",
                "data": {
                    "file_name": resume_file.filename
                }
            }
        )
    
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": f"Resume upload failed: {str(e)}"
            }
        )
