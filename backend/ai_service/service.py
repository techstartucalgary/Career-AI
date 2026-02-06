"""
Resume Tailoring Service - Main Orchestrator

This is the main service class that coordinates all modules.
Backend developers should use this as the primary interface.
"""

from typing import Dict, List, Optional, Tuple
from .models import ResumeData, CoverLetter, CoverLetterTone, CompanyResearch, SemanticAnalysisResult
from .parser import ResumeParser
from .ai_service import AIService
from .pdf_generators import PDFGenerator


class ResumeTailoringService:
    """
    Main service class for resume tailoring operations.
    
    This provides a clean API for backend integration:
    - Parse resumes from PDF
    - Analyze semantic fit with jobs
    - Generate tailored resumes
    - Create cover letters
    
    Example usage:
        service = ResumeTailoringService()
        
        # Parse resume
        resume = service.parse_resume("resume.pdf")
        
        # Analyze fit
        analysis = service.analyze_job_fit(resume, job_description)
        
        # Tailor resume
        tailored = service.tailor_resume(resume, job_description, user_answers)
        
        # Generate PDFs
        service.generate_resume_pdf(tailored, "output.pdf")
    """
    
    def __init__(self, enable_semantic_matching: bool = False):
        """
        Initialize the service with all required modules.

        Args:
            enable_semantic_matching: Whether to use semantic analysis (default: False for speed)
        """
        self.parser = ResumeParser()
        self.ai_service = AIService()
        self.pdf_generator = PDFGenerator()

        # Semantic matching is optional - DISABLED BY DEFAULT for speed
        # Enable only if you need detailed gap analysis
        if enable_semantic_matching:
            from .semantic_matcher import SemanticMatcher
            self.semantic_matcher = SemanticMatcher()
        else:
            self.semantic_matcher = None
        self.use_semantic = enable_semantic_matching
    
    # ============================================================
    # RESUME PARSING
    # ============================================================
    
    def parse_resume(self, pdf_path: str) -> ResumeData:
        """
        Parse resume PDF into structured data.
        
        Args:
            pdf_path: Path to resume PDF file
            
        Returns:
            ResumeData object with all resume information
            
        Raises:
            FileNotFoundError: If PDF doesn't exist
            ValueError: If parsing fails
        """
        return self.parser.parse_resume_from_pdf(pdf_path)
    
    def parse_resume_text(self, text: str) -> ResumeData:
        """
        Parse resume from plain text (alternative to PDF).
        
        Args:
            text: Resume as plain text
            
        Returns:
            ResumeData object
        """
        return self.parser.parse_resume_text(text)
    
    # ============================================================
    # SEMANTIC ANALYSIS
    # ============================================================
    
    def analyze_job_fit(
        self, 
        resume: ResumeData, 
        job_description: str
    ) -> Optional[SemanticAnalysisResult]:
        """
        Perform semantic analysis of resume vs job description.
        
        This is your competitive advantage over keyword-based systems.
        
        Args:
            resume: Parsed resume data
            job_description: Job posting text
            
        Returns:
            SemanticAnalysisResult with match scores and gaps, or None if disabled
        """
        if not self.use_semantic or not self.semantic_matcher:
            print("⚠ Semantic matching disabled")
            return None
        
        resume_text = resume.to_text()
        return self.semantic_matcher.find_semantic_matches(
            resume_text, 
            job_description
        )
    
    # ============================================================
    # AI-POWERED ENHANCEMENT
    # ============================================================
    
    def generate_enhancement_questions(
        self,
        resume: ResumeData,
        job_description: str,
        semantic_analysis: Optional[SemanticAnalysisResult] = None
    ) -> Tuple[list, str]:
        """
        Generate questions to ask user for better resume tailoring.
        
        Args:
            resume: Current resume
            job_description: Target job
            semantic_analysis: Optional semantic analysis results
            
        Returns:
            Tuple of (questions_list, analysis_summary)
        """
        return self.ai_service.analyze_gaps(
            resume, 
            job_description, 
            semantic_analysis
        )
    
    def tailor_resume(
        self,
        resume: ResumeData,
        job_description: str,
        user_answers: Dict[int, str],
        questions: list,
        semantic_analysis: Optional[SemanticAnalysisResult] = None
    ) -> ResumeData:
        """
        Create tailored version of resume for specific job.

        Uses semantic analysis (if provided) to prioritize which bullets
        to enhance based on gaps and weak matches.

        Args:
            resume: Original resume
            job_description: Target job description
            user_answers: User's answers to enhancement questions
            questions: The questions that were asked
            semantic_analysis: Optional semantic analysis for targeted enhancement

        Returns:
            Enhanced ResumeData
        """
        return self.ai_service.tailor_resume(
            resume,
            job_description,
            user_answers,
            questions,
            semantic_analysis
        )

    def suggest_skill_additions(
        self,
        resume: ResumeData,
        job_description: str,
        semantic_analysis: SemanticAnalysisResult
    ) -> Dict:
        """
        Get skill addition suggestions based on semantic gap analysis.

        Args:
            resume: Current resume
            job_description: Target job
            semantic_analysis: Semantic matching results

        Returns:
            Dict with skills_to_add, skills_to_emphasize, bullet_rewrites, quick_wins
        """
        return self.ai_service.suggest_skill_additions(
            resume,
            job_description,
            semantic_analysis
        )

    def reorder_resume_sections(
        self,
        resume: ResumeData,
        job_description: str,
        semantic_analysis: SemanticAnalysisResult
    ) -> ResumeData:
        """
        Reorder resume sections to put most relevant content first.

        Args:
            resume: Current resume
            job_description: Target job
            semantic_analysis: Semantic matching results

        Returns:
            Resume with reordered experiences/projects
        """
        return self.ai_service.reorder_resume_sections(
            resume,
            job_description,
            semantic_analysis
        )

    def get_enhancement_plan(
        self,
        resume: ResumeData,
        job_description: str,
        semantic_analysis: SemanticAnalysisResult
    ) -> Dict:
        """
        Generate a comprehensive enhancement plan using semantic analysis.

        Args:
            resume: Current resume
            job_description: Target job
            semantic_analysis: Semantic matching results

        Returns:
            Dict with phases, actions, and estimated score improvements
        """
        return self.ai_service.get_semantic_enhancement_plan(
            resume,
            job_description,
            semantic_analysis
        )

    def refine_resume(
        self,
        tailored_resume: ResumeData,
        job_description: str,
        max_iterations: int = 3
    ) -> Tuple[ResumeData, Dict]:
        """
        Iteratively refine a tailored resume for better quality.

        This implements the review-and-refine loop for continuous improvement.
        The system will analyze the resume, identify weaknesses, and apply
        targeted refinements until quality threshold is met or max iterations reached.

        Args:
            tailored_resume: Previously tailored resume
            job_description: Target job description
            max_iterations: Maximum refinement passes (default: 3)

        Returns:
            Tuple of (refined_resume, final_review_feedback)
        """
        current_resume = tailored_resume
        final_feedback = {}

        for iteration in range(1, max_iterations + 1):
            refined, feedback = self.ai_service.review_and_refine(
                current_resume,
                job_description,
                iteration=iteration
            )

            final_feedback = feedback

            # Stop if no refinement was needed or error occurred
            if not feedback.get('refined', False) or feedback.get('status') == 'error':
                break

            current_resume = refined

        return current_resume, final_feedback

    def extract_job_keywords(self, job_description: str) -> List[str]:
        """
        Extract priority keywords from a job description.

        Useful for understanding what skills/terms to emphasize.

        Args:
            job_description: Job posting text

        Returns:
            List of priority keywords sorted by importance
        """
        return self.ai_service._extract_priority_keywords(job_description)

    # ============================================================
    # COVER LETTER GENERATION
    # ============================================================
    
    def generate_cover_letter(
        self,
        resume: ResumeData,
        job_description: str,
        company_name: str,
        position: str,
        tone: Optional[CoverLetterTone] = None,
        with_research: bool = True
    ) -> CoverLetter:
        """
        Generate personalized cover letter with automatic company research and tone detection.

        Args:
            resume: Candidate's resume
            job_description: Job posting
            company_name: Company name
            position: Job title
            tone: Optional tone settings (auto-detected if not provided)
            with_research: Whether to perform company research (default: True)

        Returns:
            CoverLetter object with personalized content
        """
        company_research = None
        hiring_manager = None

        if with_research:
            company_research = self.ai_service.research_company(company_name, job_description)
            hiring_manager = self.ai_service.find_hiring_manager(job_description, company_name)

        return self.ai_service.generate_cover_letter(
            resume,
            job_description,
            company_name,
            position,
            tone=tone,
            company_research=company_research,
            hiring_manager=hiring_manager
        )

    def generate_cover_letter_variants(
        self,
        resume: ResumeData,
        job_description: str,
        company_name: str,
        position: str,
        num_variants: int = 2
    ) -> List[CoverLetter]:
        """
        Generate multiple cover letter variants for A/B comparison.

        Args:
            resume: Candidate's resume
            job_description: Job posting
            company_name: Company name
            position: Job title
            num_variants: Number of variants to generate (default: 2)

        Returns:
            List of CoverLetter objects with different tones/styles
        """
        return self.ai_service.generate_cover_letter_variants(
            resume,
            job_description,
            company_name,
            position,
            num_variants
        )

    def refine_cover_letter(
        self,
        cover_letter: CoverLetter,
        resume: ResumeData,
        job_description: str,
        feedback: Optional[str] = None
    ) -> CoverLetter:
        """
        Refine an existing cover letter based on review or user feedback.

        Args:
            cover_letter: Existing cover letter to refine
            resume: Candidate's resume for fact-checking
            job_description: Job posting for alignment
            feedback: Optional specific feedback to address

        Returns:
            Refined CoverLetter object
        """
        return self.ai_service.refine_cover_letter(
            cover_letter,
            resume,
            job_description,
            feedback
        )

    def research_company(self, company_name: str, job_description: str) -> CompanyResearch:
        """
        Research a company for cover letter personalization.

        Args:
            company_name: Name of the company
            job_description: Job posting text

        Returns:
            CompanyResearch object with gathered information
        """
        return self.ai_service.research_company(company_name, job_description)
    
    # ============================================================
    # PDF GENERATION
    # ============================================================
    
    def generate_resume_pdf(self, resume: ResumeData, output_path: str) -> bool:
        """
        Generate resume PDF file.
        
        Args:
            resume: Resume data to render
            output_path: Where to save PDF
            
        Returns:
            True if successful, False otherwise
        """
        return self.pdf_generator.generate_resume_pdf(resume, output_path)
    
    def generate_cover_letter_pdf(
        self, 
        cover_letter: CoverLetter, 
        resume: ResumeData,
        output_path: str
    ) -> bool:
        """
        Generate cover letter PDF file.
        
        Args:
            cover_letter: Cover letter data
            resume: Resume (for contact info)
            output_path: Where to save PDF
            
        Returns:
            True if successful, False otherwise
        """
        return self.pdf_generator.generate_cover_letter_pdf(
            cover_letter,
            resume.header,
            output_path
        )
    
    # ============================================================
    # COMPLETE WORKFLOW
    # ============================================================
    
    def complete_tailoring_workflow(
        self,
        resume_pdf_path: str,
        job_description: str,
        output_resume_path: str,
        user_answers: Optional[Dict[int, str]] = None,
        generate_cover_letter: bool = False,
        company_name: Optional[str] = None,
        position: Optional[str] = None,
        cover_letter_path: Optional[str] = None,
        enable_refinement: bool = False,
        max_refinement_iterations: int = 2,
        skip_questions: bool = True  # Skip question generation by default for speed
    ) -> Dict[str, any]:
        """
        Complete end-to-end workflow for backend integration.

        This method handles the entire process:
        1. Parse resume
        2. Semantic analysis (if enabled)
        3. Generate questions (if no answers provided)
        4. Tailor resume
        5. Iterative refinement (if enabled)
        6. Generate PDFs

        Args:
            resume_pdf_path: Path to original resume PDF
            job_description: Job posting text
            output_resume_path: Where to save tailored resume
            user_answers: Optional pre-collected answers
            generate_cover_letter: Whether to create cover letter
            company_name: Company name (required if generate_cover_letter=True)
            position: Job title (required if generate_cover_letter=True)
            cover_letter_path: Where to save cover letter PDF
            enable_refinement: Whether to run iterative refinement (default: True)
            max_refinement_iterations: Max refinement passes (default: 2)

        Returns:
            Dict with results:
            {
                'resume': ResumeData,
                'semantic_analysis': SemanticAnalysisResult or None,
                'questions': list,
                'analysis': str,
                'tailored_resume': ResumeData,
                'refinement_feedback': Dict or None,
                'resume_pdf_generated': bool,
                'cover_letter': CoverLetter or None,
                'cover_letter_pdf_generated': bool
            }
        """
        import time
        workflow_start = time.time()
        results = {}

        # 1. Parse resume
        print("\n" + "=" * 70)
        print("RESUME TAILORING WORKFLOW")
        print("=" * 70)

        step_start = time.time()
        resume = self.parse_resume(resume_pdf_path)
        results['resume'] = resume
        print(f"⏱️  Step 1 (Parse): {time.time() - step_start:.1f}s")
        
        # 2. Semantic analysis
        step_start = time.time()
        semantic_analysis = None
        if self.use_semantic:
            semantic_analysis = self.analyze_job_fit(resume, job_description)
            results['semantic_analysis'] = semantic_analysis
        print(f"⏱️  Step 2 (Semantic): {time.time() - step_start:.1f}s")

        # 3. Generate questions (SKIP by default for speed)
        step_start = time.time()
        questions = []
        analysis = "Questions skipped for speed"
        if not skip_questions:
            questions, analysis = self.generate_enhancement_questions(
                resume,
                job_description,
                semantic_analysis
            )
            print(f"⏱️  Step 3 (Questions): {time.time() - step_start:.1f}s")
        else:
            print(f"⏱️  Step 3 (Questions): SKIPPED for speed")
        results['questions'] = questions
        results['analysis'] = analysis

        print(f"\n📊 Analysis: {analysis}")

        # 4. Tailor resume (using semantic analysis for targeted enhancement)
        step_start = time.time()
        user_answers = user_answers or {}
        tailored_resume = self.tailor_resume(
            resume,
            job_description,
            user_answers,
            questions,
            semantic_analysis  # Pass semantic analysis for targeted bullet enhancement
        )
        print(f"⏱️  Step 4 (Tailor): {time.time() - step_start:.1f}s")

        # 5. Iterative refinement (if enabled)
        results['refinement_feedback'] = None
        if enable_refinement:
            step_start = time.time()
            tailored_resume, refinement_feedback = self.refine_resume(
                tailored_resume,
                job_description,
                max_iterations=max_refinement_iterations
            )
            results['refinement_feedback'] = refinement_feedback
            print(f"⏱️  Step 5 (Refinement): {time.time() - step_start:.1f}s")

        results['tailored_resume'] = tailored_resume

        # 6. Generate resume PDF
        step_start = time.time()
        resume_success = self.generate_resume_pdf(tailored_resume, output_resume_path)
        results['resume_pdf_generated'] = resume_success
        print(f"⏱️  Step 6 (PDF): {time.time() - step_start:.1f}s")
        
        if resume_success:
            print(f"\n✓ Tailored resume saved: {output_resume_path}")
        
        # 7. Cover letter (if requested)
        if generate_cover_letter:
            if not company_name or not position:
                print("⚠ Skipping cover letter: missing company_name or position")
                results['cover_letter'] = None
                results['cover_letter_pdf_generated'] = False
            else:
                cover_letter = self.generate_cover_letter(
                    tailored_resume,
                    job_description,
                    company_name,
                    position
                )
                results['cover_letter'] = cover_letter
                
                cl_path = cover_letter_path or output_resume_path.replace('.pdf', '_cover_letter.pdf')
                cl_success = self.generate_cover_letter_pdf(
                    cover_letter,
                    tailored_resume,
                    cl_path
                )
                results['cover_letter_pdf_generated'] = cl_success
                
                if cl_success:
                    print(f"✓ Cover letter saved: {cl_path}")
        
        total_workflow_time = time.time() - workflow_start
        print("\n" + "=" * 70)
        print("WORKFLOW COMPLETE")
        print(f"⏱️  TOTAL TIME: {total_workflow_time:.1f}s ({total_workflow_time/60:.1f} minutes)")
        print("=" * 70 + "\n")

        return results

    def fast_tailor(
        self,
        resume_pdf_path: str,
        job_description: str,
        output_resume_path: str,
        user_answers: Optional[Dict[int, str]] = None
    ) -> Dict[str, any]:
        """
        FAST tailoring workflow - optimized for speed (target: <30 seconds).

        This skips:
        - Semantic analysis (saves ~15s)
        - Question generation (saves ~8s)
        - Iterative refinement (saves ~20s)

        Only runs:
        1. Parse resume (~8s)
        2. Tailor resume (~15s)
        3. Generate PDF (~0.5s)

        Args:
            resume_pdf_path: Path to original resume PDF
            job_description: Job posting text
            output_resume_path: Where to save tailored resume
            user_answers: Optional pre-collected answers (if you have them)

        Returns:
            Dict with results:
            {
                'resume': ResumeData,
                'tailored_resume': ResumeData,
                'resume_pdf_generated': bool,
                'total_time': float
            }
        """
        import time
        workflow_start = time.time()
        results = {}

        print("\n" + "=" * 70)
        print("⚡ FAST RESUME TAILORING (Target: <30s)")
        print("=" * 70)

        # 1. Parse resume
        step_start = time.time()
        resume = self.parse_resume(resume_pdf_path)
        results['resume'] = resume
        parse_time = time.time() - step_start
        print(f"⏱️  Step 1 (Parse): {parse_time:.1f}s")

        # 2. Tailor resume directly (skip questions and semantic)
        step_start = time.time()
        user_answers = user_answers or {}
        tailored_resume = self.tailor_resume(
            resume,
            job_description,
            user_answers,
            questions=[],  # No questions
            semantic_analysis=None  # No semantic analysis
        )
        results['tailored_resume'] = tailored_resume
        tailor_time = time.time() - step_start
        print(f"⏱️  Step 2 (Tailor): {tailor_time:.1f}s")

        # 3. Generate PDF
        step_start = time.time()
        resume_success = self.generate_resume_pdf(tailored_resume, output_resume_path)
        results['resume_pdf_generated'] = resume_success
        pdf_time = time.time() - step_start
        print(f"⏱️  Step 3 (PDF): {pdf_time:.1f}s")

        if resume_success:
            print(f"\n✓ Tailored resume saved: {output_resume_path}")

        total_workflow_time = time.time() - workflow_start
        results['total_time'] = total_workflow_time

        print("\n" + "=" * 70)
        status = "✅ TARGET MET!" if total_workflow_time < 40 else "⚠️ OVER TARGET"
        print(f"⚡ FAST WORKFLOW COMPLETE - {status}")
        print(f"⏱️  TOTAL TIME: {total_workflow_time:.1f}s")
        print("=" * 70 + "\n")

        return results
