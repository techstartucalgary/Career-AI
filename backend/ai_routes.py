"""
AI Routes - Resume and Cover Letter generation endpoints
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pathlib import Path
import tempfile
from datetime import datetime
import json
import base64
import re
import traceback
from langchain_core.messages import HumanMessage

from ai_service.service import ResumeTailoringService
from ai_service.ai_service import AIService

# Create router
router = APIRouter(prefix="/api", tags=["AI Services"])

# Initialize AI service
ai_service = ResumeTailoringService(enable_semantic_matching=False)


@router.post("/resume/analyze")
async def analyze_resume(
    resume_file: UploadFile = File(...),
    job_description: str = Form(...)
):
    """Analyze resume against job description"""
    try:
        if not job_description:
            raise HTTPException(status_code=400, detail="Missing job_description")
        
        # Save uploaded file temporarily
        temp_dir = tempfile.gettempdir()
        temp_file_path = Path(temp_dir) / f"resume_{datetime.now().timestamp()}.pdf"
        
        with open(temp_file_path, "wb") as buffer:
            buffer.write(await resume_file.read())
        
        resume = ai_service.parse_resume(str(temp_file_path))
        semantic_analysis = ai_service.analyze_job_fit(resume, job_description)
        questions, analysis = ai_service.generate_enhancement_questions(
            resume, job_description, semantic_analysis
        )
        
        # Clean up temp file
        temp_file_path.unlink()
        
        return {
            "success": True,
            "analysis": analysis,
            "questions": questions,
            "match_score": semantic_analysis.overall_score if semantic_analysis else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/resume/tailor")
async def tailor_resume(
    resume_file: UploadFile = File(...),
    job_description: str = Form(...),
    user_answers: str = Form(default="{}")
):
    """Generate tailored resume from job description"""
    try:
        if not job_description:
            raise HTTPException(status_code=400, detail="Missing job_description")
        
        # Parse user answers
        answers = json.loads(user_answers) if user_answers else {}
        
        # Save uploaded file temporarily
        temp_dir = tempfile.gettempdir()
        temp_file_path = Path(temp_dir) / f"resume_{datetime.now().timestamp()}.pdf"
        
        with open(temp_file_path, "wb") as buffer:
            buffer.write(await resume_file.read())
        
        print(f"Processing resume: {temp_file_path}")
        print(f"Job description length: {len(job_description)}")
        
        resume = ai_service.parse_resume(str(temp_file_path))
        print("Resume parsed successfully")
        
        semantic_analysis = ai_service.analyze_job_fit(resume, job_description)
        print("Job fit analysis completed")
        
        questions, _ = ai_service.generate_enhancement_questions(
            resume, job_description, semantic_analysis
        )
        print("Enhancement questions generated")
        
        tailored_resume = ai_service.tailor_resume(
            resume, job_description, answers, questions, semantic_analysis
        )
        print("Resume tailored successfully")
        
        # Refine the resume
        refined_resume, feedback = ai_service.refine_resume(
            tailored_resume, job_description, max_iterations=2
        )
        print("Resume refined successfully")
        
        # Generate PDF
        output_path = Path(temp_dir) / f"tailored_resume_{datetime.now().timestamp()}.pdf"
        ai_service.generate_resume_pdf(refined_resume, str(output_path))
        print(f"PDF generated: {output_path}")
        
        # Clean up temp input file
        temp_file_path.unlink()
        
        # Read PDF as bytes and encode for JSON response
        with open(output_path, "rb") as pdf_file:
            pdf_bytes = pdf_file.read()
        
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
        
        return {
            "success": True,
            "resume_text": refined_resume.to_text(),
            "resume_data": refined_resume.dict(),
            "pdf_base64": pdf_base64,
            "feedback": feedback
        }
    except Exception as e:
        error_details = traceback.format_exc()
        print(f"Error in tailor_resume: {error_details}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cover-letter/generate")
async def generate_cover_letter(
    resume_file: UploadFile = File(...),
    job_description: str = Form(...)
):
    """Generate cover letter from resume and job description"""
    try:
        if not job_description:
            raise HTTPException(status_code=400, detail="Missing job_description")
        
        # Save uploaded file temporarily
        temp_dir = tempfile.gettempdir()
        temp_file_path = Path(temp_dir) / f"resume_{datetime.now().timestamp()}.pdf"
        
        with open(temp_file_path, "wb") as buffer:
            buffer.write(await resume_file.read())
        
        resume = ai_service.parse_resume(str(temp_file_path))
        
        # Extract company name and position from job description using AI
        ai_extractor = AIService()
        
        # Use LLM to extract company and position
        extraction_prompt = f"""Extract the company name and job position/title from this job description. 
        Return ONLY a JSON object with 'company' and 'position' keys. If not found, use 'the company' and 'the position' as defaults.

Job Description:
{job_description[:2000]}

JSON:"""
        
        response = ai_extractor.llm.invoke([HumanMessage(content=extraction_prompt)])
        
        # Parse the response
        response_text = response.content
        # Extract JSON from response
        json_match = re.search(r'\{[^}]+\}', response_text)
        if json_match:
            extracted = json.loads(json_match.group())
            company_name = extracted.get('company', 'the company')
            position = extracted.get('position', 'the position')
        else:
            company_name = 'the company'
            position = 'the position'
        
        cover_letter = ai_service.generate_cover_letter(
            resume, job_description, company_name, position, with_research=True
        )
        
        print(f"Cover letter generated with {len(cover_letter.paragraphs)} paragraphs")
        
        # Generate PDF
        output_path = Path(temp_dir) / f"cover_letter_{datetime.now().timestamp()}.pdf"
        ai_service.generate_cover_letter_pdf(cover_letter, resume, str(output_path))
        
        # Clean up temp input file
        temp_file_path.unlink()
        
        # Read PDF as bytes and encode for JSON response
        with open(output_path, "rb") as pdf_file:
            pdf_bytes = pdf_file.read()
        
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
        
        # Format the cover letter text
        full_text = "\n\n".join(cover_letter.paragraphs)
        
        return {
            "success": True,
            "cover_letter": {
                "paragraphs": cover_letter.paragraphs,
                "full_text": full_text,
                "company_name": cover_letter.company_name,
                "position": cover_letter.position
            },
            "pdf_base64": pdf_base64,
            "tone": cover_letter.tone.dict() if cover_letter.tone else None,
            "extracted_info": {
                "company": company_name,
                "position": position
            }
        }
    except Exception as e:
        error_details = traceback.format_exc()
        print(f"Error in generate_cover_letter: {error_details}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download/{filename}")
async def download_file(filename: str):
    """Download generated PDF file"""
    try:
        temp_dir = tempfile.gettempdir()
        file_path = Path(temp_dir) / filename
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        from fastapi.responses import FileResponse
        return FileResponse(
            path=str(file_path),
            filename=filename,
            media_type='application/pdf'
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
