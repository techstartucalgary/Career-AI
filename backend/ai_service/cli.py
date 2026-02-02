"""
Command-line interface for resume tailoring.

This is a thin wrapper around the service for CLI users.
Backend developers should use service.py directly.
"""

import argparse
from typing import Dict
from service import ResumeTailoringService


def ask_questions_cli(questions: list) -> Dict[int, str]:
    """
    Interactive CLI question-asking.

    Args:
        questions: List of question dicts

    Returns:
        Dict mapping question IDs to answers
    """
    print("\n" + "=" * 70)
    print("Answer these questions to improve your resume.")
    print("Type 'skip' to skip, 'done' to finish early")
    print("=" * 70 + "\n")

    answers = {}
    for q in questions:
        print(f"Q{q['id']}: {q['question']}")
        print(f"     (Context: {q['context']})")

        answer = input("     → Your answer: ").strip()

        if answer.lower() == 'done':
            print("\n✓ Moving to resume generation...\n")
            break
        elif answer.lower() == 'skip' or not answer:
            continue
        else:
            answers[q['id']] = answer
        print()

    print(f"Collected {len(answers)} responses\n")
    return answers


def prompt_for_missing_contact_info(resume) -> None:
    """
    Check for missing contact info and prompt user to provide it.

    Args:
        resume: ResumeData object to update in-place
    """
    missing = resume.header.get_missing_contact_info()

    if not missing:
        return

    print("\n" + "=" * 70)
    print("MISSING CONTACT INFORMATION")
    print("=" * 70)
    print("Your resume is missing some important contact details.")
    print("Recruiters need this information to reach you!\n")

    field_prompts = {
        "email": "Email address",
        "phone": "Phone number (e.g., +1-555-123-4567)",
        "linkedin": "LinkedIn profile URL (e.g., linkedin.com/in/yourname)"
    }

    for field in missing:
        prompt = field_prompts.get(field, field.capitalize())
        while True:
            value = input(f"  {prompt}: ").strip()
            if value:
                setattr(resume.header, field, value)
                print(f"    ✓ {field.capitalize()} added\n")
                break
            else:
                skip = input(f"    Skip {field}? (y/n): ").strip().lower()
                if skip == 'y':
                    print(f"    ⚠ Skipping {field} (not recommended)\n")
                    break

    print("=" * 70 + "\n")


def main():
    """CLI entry point"""
    parser = argparse.ArgumentParser(
        description="AI-Powered Resume Tailoring with Semantic Matching",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Tailor existing resume to job
  python cli.py --resume resume.pdf --job-description job.txt -o tailored.pdf
  
  # With cover letter
  python cli.py --resume resume.pdf --job-description job.txt \\
    --cover-letter --company "Google" --position "SWE Intern"
  
  # Disable semantic matching (faster, less accurate)
  python cli.py --resume resume.pdf --job-description job.txt --no-semantic
        """
    )

    # Input files
    parser.add_argument(
        "--resume",
        required=True,
        help="Path to resume PDF"
    )
    parser.add_argument(
        "--job-description",
        required=True,
        help="Path to job description text file"
    )

    # Output options
    parser.add_argument(
        "-o", "--output",
        default="tailored_resume.pdf",
        help="Output resume PDF path (default: tailored_resume.pdf)"
    )

    # Cover letter options
    parser.add_argument(
        "--cover-letter",
        action="store_true",
        help="Also generate cover letter"
    )
    parser.add_argument(
        "--company",
        help="Company name (required for cover letter)"
    )
    parser.add_argument(
        "--position",
        help="Position title (required for cover letter)"
    )
    parser.add_argument(
        "--cover-letter-output",
        help="Cover letter output path (default: <output>_cover_letter.pdf)"
    )

    # Feature flags
    parser.add_argument(
        "--no-semantic",
        action="store_true",
        help="Disable semantic matching (faster but less accurate)"
    )
    parser.add_argument(
        "--skip-questions",
        action="store_true",
        help="Skip interactive questions, use only resume content"
    )

    args = parser.parse_args()

    # Read job description
    try:
        with open(args.job_description, 'r', encoding='utf-8') as f:
            job_desc = f.read()
    except FileNotFoundError:
        print(f"❌ Error: Job description file not found: {args.job_description}")
        return 1
    except Exception as e:
        print(f"❌ Error reading job description: {e}")
        return 1

    # Initialize service
    enable_semantic = not args.no_semantic
    service = ResumeTailoringService(enable_semantic_matching=enable_semantic)

    try:
        # Parse resume
        resume = service.parse_resume(args.resume)

        # Check for missing contact info and prompt user
        prompt_for_missing_contact_info(resume)

        # Semantic analysis
        semantic_analysis = None
        if enable_semantic:
            semantic_analysis = service.analyze_job_fit(resume, job_desc)
            
            if semantic_analysis:
                print("\n" + "=" * 70)
                print("SEMANTIC ANALYSIS RESULTS")
                print("=" * 70)
                print(f"Overall Match: {semantic_analysis.overall_match:.1%}")
                print(f"Coverage: {semantic_analysis.coverage:.1%}")
                print(f"\nTop Missing Skills:")
                for skill in semantic_analysis.top_missing_skills[:5]:
                    print(f"  ❌ {skill}")
                print(f"\nTop Matching Skills:")
                for skill in semantic_analysis.top_matching_skills[:5]:
                    print(f"  ✅ {skill}")
                print("=" * 70)

        # Generate questions
        questions, analysis = service.generate_enhancement_questions(
            resume,
            job_desc,
            semantic_analysis
        )

        print(f"\n📊 Analysis: {analysis}\n")

        # Ask questions (unless skipped)
        user_answers = {}
        if not args.skip_questions and questions:
            user_answers = ask_questions_cli(questions)

        # Tailor resume (using semantic analysis for targeted enhancement)
        tailored_resume = service.tailor_resume(
            resume,
            job_desc,
            user_answers,
            questions,
            semantic_analysis  # Pass semantic analysis for prioritized bullet enhancement
        )

        # Generate resume PDF
        success = service.generate_resume_pdf(tailored_resume, args.output)

        if not success:
            print("❌ Failed to generate resume PDF")
            return 1

        print(f"\n✅ SUCCESS! Tailored resume saved to: {args.output}")

        # Cover letter (if requested)
        if args.cover_letter:
            if not args.company or not args.position:
                print("\n⚠ Warning: Skipping cover letter (need --company and --position)")
            else:
                cover_letter = service.generate_cover_letter(
                    tailored_resume,
                    job_desc,
                    args.company,
                    args.position
                )

                cl_path = args.cover_letter_output or args.output.replace('.pdf', '_cover_letter.pdf')
                cl_success = service.generate_cover_letter_pdf(
                    cover_letter,
                    tailored_resume,
                    cl_path
                )

                if cl_success:
                    print(f"✅ Cover letter saved to: {cl_path}")
                else:
                    print("❌ Failed to generate cover letter PDF")

        return 0

    except FileNotFoundError as e:
        print(f"❌ Error: {e}")
        return 1
    except ValueError as e:
        print(f"❌ Validation Error: {e}")
        return 1
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit(main())
