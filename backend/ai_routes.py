"""
AI Routes - Resume and Cover Letter generation endpoints
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from pathlib import Path
import tempfile
from datetime import datetime
import json
import base64
import re
import traceback
import asyncio
from langchain_core.messages import HumanMessage

from ai_service.service import ResumeTailoringService
import asyncio
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
    """Generate tailored resume from job description with streaming progress"""
    async def generate_with_progress():
        try:
            if not job_description:
                yield f"data: {json.dumps({'error': 'Missing job_description'})}\n\n"
                return
            
            # Parse user answers
            answers = json.loads(user_answers) if user_answers else {}
            
            # Save uploaded file temporarily
            temp_dir = tempfile.gettempdir()
            temp_file_path = Path(temp_dir) / f"resume_{datetime.now().timestamp()}.pdf"
            
            with open(temp_file_path, "wb") as buffer:
                buffer.write(await resume_file.read())
            
            # Step 1: Parse resume
            yield f"data: {json.dumps({'step': 'Reading through your resume...', 'progress': 5})}\n\n"
            await asyncio.sleep(1.5)
            yield f"data: {json.dumps({'step': 'Extracting work experience and skills', 'progress': 10})}\n\n"
            await asyncio.sleep(1.5)
            resume = ai_service.parse_resume(str(temp_file_path))
            
            # Step 2: Analyze job fit
            yield f"data: {json.dumps({'step': 'Understanding job requirements...', 'progress': 18})}\n\n"
            await asyncio.sleep(1.5)
            yield f"data: {json.dumps({'step': 'Comparing your skills to job needs', 'progress': 25})}\n\n"
            await asyncio.sleep(1.5)
            yield f"data: {json.dumps({'step': 'Identifying skill gaps and strengths', 'progress': 32})}\n\n"
            await asyncio.sleep(1.5)
            semantic_analysis = ai_service.analyze_job_fit(resume, job_description)
            
            # Step 3: Generate questions
            yield f"data: {json.dumps({'step': 'Finding opportunities to highlight impact', 'progress': 40})}\n\n"
            await asyncio.sleep(1.5)
            yield f"data: {json.dumps({'step': 'Considering how to align with company culture', 'progress': 45})}\n\n"
            await asyncio.sleep(1.5)
            questions, _ = ai_service.generate_enhancement_questions(
                resume, job_description, semantic_analysis
            )
            
            # Step 4: Tailor resume
            yield f"data: {json.dumps({'step': 'Rewriting experience to match job keywords', 'progress': 52})}\n\n"
            await asyncio.sleep(1.5)
            yield f"data: {json.dumps({'step': 'Emphasizing relevant accomplishments', 'progress': 60})}\n\n"
            await asyncio.sleep(1.5)
            yield f"data: {json.dumps({'step': 'Restructuring bullet points for clarity', 'progress': 67})}\n\n"
            await asyncio.sleep(1.5)
            tailored_resume = ai_service.tailor_resume(
                resume, job_description, answers, questions, semantic_analysis
            )
            
            # Step 5: Refine
            yield f"data: {json.dumps({'step': 'Polishing language and removing redundancy', 'progress': 75})}\n\n"
            await asyncio.sleep(1.5)
            yield f"data: {json.dumps({'step': 'Ensuring ATS compatibility', 'progress': 82})}\n\n"
            await asyncio.sleep(1.5)
            refined_resume, feedback = ai_service.refine_resume(
                tailored_resume, job_description, max_iterations=2
            )
            
            # Step 6: Generate PDF
            yield f"data: {json.dumps({'step': 'Formatting professional layout', 'progress': 90})}\n\n"
            await asyncio.sleep(1.5)
            yield f"data: {json.dumps({'step': 'Generating final PDF document', 'progress': 95})}\n\n"
            await asyncio.sleep(1.5)
            output_path = Path(temp_dir) / f"tailored_resume_{datetime.now().timestamp()}.pdf"
            ai_service.generate_resume_pdf(refined_resume, str(output_path))
            
            # Clean up temp input file
            temp_file_path.unlink()
            
            # Read PDF and encode
            with open(output_path, "rb") as pdf_file:
                pdf_bytes = pdf_file.read()
            
            pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
            
            # Final result
            result = {
                "success": True,
                "resume_text": refined_resume.to_text(),
                "resume_data": refined_resume.dict(),
                "pdf_base64": pdf_base64,
                "feedback": feedback,
                "progress": 100
            }
            yield f"data: {json.dumps(result)}\n\n"
            
        except Exception as e:
            error_details = traceback.format_exc()
            print(f"Error in tailor_resume: {error_details}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(generate_with_progress(), media_type="text/event-stream")


@router.post("/cover-letter/generate")
async def generate_cover_letter(
    resume_file: UploadFile = File(...),
    job_description: str = Form(...)
):
    """Generate cover letter from resume and job description with streaming progress"""
    async def generate_with_progress():
        try:
            if not job_description:
                yield f"data: {json.dumps({'error': 'Missing job_description'})}\n\n"
                return
            
            # Save uploaded file temporarily
            temp_dir = tempfile.gettempdir()
            temp_file_path = Path(temp_dir) / f"resume_{datetime.now().timestamp()}.pdf"
            
            with open(temp_file_path, "wb") as buffer:
                buffer.write(await resume_file.read())
            
            # Step 1: Parse resume
            yield f"data: {json.dumps({'step': 'Reading your resume details...', 'progress': 8})}\n\n"
            await asyncio.sleep(1.5)
            yield f"data: {json.dumps({'step': 'Extracting key achievements', 'progress': 15})}\n\n"
            await asyncio.sleep(1.5)
            resume = ai_service.parse_resume(str(temp_file_path))
            
            # Step 2: Extract job details
            yield f"data: {json.dumps({'step': 'Analyzing job posting...', 'progress': 22})}\n\n"
            await asyncio.sleep(1.5)
            yield f"data: {json.dumps({'step': 'Identifying company and role requirements', 'progress': 30})}\n\n"
            await asyncio.sleep(1.5)
            
            from ai_service.ai_service import AIService
            ai_extractor = AIService()
            
            extraction_prompt = f"""Extract the company name and job position/title from this job description. 
            Return ONLY a JSON object with 'company' and 'position' keys. If not found, use 'the company' and 'the position' as defaults.

Job Description:
{job_description[:2000]}

JSON:"""
            
            response = ai_extractor.llm.invoke([HumanMessage(content=extraction_prompt)])
            response_text = response.content
            json_match = re.search(r'\{[^}]+\}', response_text)
            if json_match:
                extracted = json.loads(json_match.group())
                company_name = extracted.get('company', 'the company')
                position = extracted.get('position', 'the position')
            else:
                company_name = 'the company'
                position = 'the position'
            
            # Step 3: Generate cover letter
            yield f"data: {json.dumps({'step': 'Finding compelling ways to connect your background', 'progress': 42})}\n\n"
            await asyncio.sleep(1.5)
            yield f"data: {json.dumps({'step': 'Crafting personalized opening paragraph', 'progress': 52})}\n\n"
            await asyncio.sleep(1.5)
            yield f"data: {json.dumps({'step': 'Highlighting relevant experiences', 'progress': 62})}\n\n"
            await asyncio.sleep(1.5)
            yield f"data: {json.dumps({'step': 'Writing compelling call to action', 'progress': 72})}\n\n"
            await asyncio.sleep(1.5)
            
            cover_letter = ai_service.generate_cover_letter(
                resume, job_description, company_name, position, with_research=True
            )
            
            # Step 4: Generate PDF
            yield f"data: {json.dumps({'step': 'Polishing tone and language', 'progress': 82})}\n\n"
            await asyncio.sleep(1.5)
            yield f"data: {json.dumps({'step': 'Formatting professional layout', 'progress': 90})}\n\n"
            await asyncio.sleep(1.5)
            yield f"data: {json.dumps({'step': 'Creating final PDF document', 'progress': 96})}\n\n"
            await asyncio.sleep(1.5)
            
            output_path = Path(temp_dir) / f"cover_letter_{datetime.now().timestamp()}.pdf"
            ai_service.generate_cover_letter_pdf(cover_letter, resume, str(output_path))
            
            # Clean up temp input file
            temp_file_path.unlink()
            
            # Read PDF and encode
            with open(output_path, "rb") as pdf_file:
                pdf_bytes = pdf_file.read()
            
            pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
            full_text = "\n\n".join(cover_letter.paragraphs)
            
            # Final result
            result = {
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
                },
                "progress": 100
            }
            yield f"data: {json.dumps(result)}\n\n"
            
        except Exception as e:
            error_details = traceback.format_exc()
            print(f"Error in generate_cover_letter: {error_details}")
            yield f"data: {json.dumps({'error': str(e)})}\\n\\n"
    
    return StreamingResponse(generate_with_progress(), media_type="text/event-stream")


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
