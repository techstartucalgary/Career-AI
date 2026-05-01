"""
PDF generation module.
Handles resume and cover letter PDF creation.
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime
from copy import deepcopy
import re
from .models import ResumeData, CoverLetter, Header
from .config import MIN_GPA_DISPLAY


# Pre-compile regex patterns for better performance
_BOLD_PATTERN = re.compile(r'\*\*(.+?)\*\*')
_BOLD_UNDERSCORE_PATTERN = re.compile(r'__(.+?)__')
_ITALIC_PATTERN = re.compile(r'\*(.+?)\*')
_ITALIC_UNDERSCORE_PATTERN = re.compile(r'_(.+?)_')

def clean_markdown_text(text: str) -> str:
    """Remove markdown formatting characters from text (optimized)"""
    if not text:
        return text
    # Use pre-compiled patterns for faster processing
    text = _BOLD_PATTERN.sub(r'\1', text)
    text = _BOLD_UNDERSCORE_PATTERN.sub(r'\1', text)
    text = _ITALIC_PATTERN.sub(r'\1', text)
    text = _ITALIC_UNDERSCORE_PATTERN.sub(r'\1', text)
    text = text.replace('*', '')
    return text.strip()


class PDFGenerator:
    """
    Handles all PDF generation.

    Supports:
    - Resume PDFs (Jake's template style)
    - Cover letter PDFs
    - Multiple template styles: classic, modern, compact
    """

    # Cache styles as class variables (created once, reused forever)
    _resume_styles = None
    _cover_letter_styles = None
    _table_style_cached = None

    # Additional template style caches
    _resume_modern_styles = None
    _resume_compact_styles = None
    _cover_letter_modern_styles = None
    _cover_letter_compact_styles = None

    @staticmethod
    def generate_resume_pdf(resume: ResumeData, output_path: str, template: str = 'classic') -> bool:
        """
        Generate ATS-friendly resume PDF, enforcing a single-page result.

        Renders the resume; if the output spills onto page 2, iteratively trims the
        weakest bullets (longest entries first) and re-renders. Caller's resume
        object is never mutated.
        """
        import time
        start_time = time.time()

        # Work on a copy so the caller's object is untouched.
        working = deepcopy(resume)
        max_iterations = 6

        for attempt in range(max_iterations + 1):
            if not PDFGenerator._render_resume_to_path(working, output_path, template):
                return False

            page_count = PDFGenerator._count_pdf_pages(output_path)
            if page_count is None or page_count <= 1:
                if attempt > 0:
                    print(f"  ✓ Resume fits on 1 page after {attempt} trim pass(es)")
                pdf_time = time.time() - start_time
                print(f"  ✓ Resume PDF generated in {pdf_time:.1f}s: {output_path}")
                return True

            if attempt == max_iterations:
                print(f"  ⚠ Resume still {page_count} pages after {max_iterations} trim passes — leaving as-is")
                pdf_time = time.time() - start_time
                print(f"  ✓ Resume PDF generated in {pdf_time:.1f}s: {output_path}")
                return True

            if not PDFGenerator._trim_one_bullet(working):
                # nothing left to trim
                pdf_time = time.time() - start_time
                print(f"  ⚠ Cannot trim further; resume PDF generated in {pdf_time:.1f}s: {output_path}")
                return True

        return True

    @staticmethod
    def _count_pdf_pages(pdf_path: str):
        """Return the page count of a PDF, or None if it cannot be read."""
        try:
            from pypdf import PdfReader
            reader = PdfReader(pdf_path)
            return len(reader.pages)
        except Exception as e:
            print(f"  ⚠ Could not count PDF pages ({e}); skipping page-fit enforcement")
            return None

    @staticmethod
    def _trim_one_bullet(resume: ResumeData) -> bool:
        """
        Drop the LAST bullet of whichever experience or project currently has the
        most bullets (preferring experience entries over projects when tied).
        Floor: never reduce an entry below 1 bullet.

        Returns True if a bullet was removed, False if nothing left to trim.
        """
        target = None  # ('experience' | 'project', index, current_bullet_count)

        for i, exp in enumerate(resume.experience or []):
            n = len(exp.bullets or [])
            if n > 1 and (target is None or n > target[2]):
                target = ('experience', i, n)

        for i, proj in enumerate(resume.projects or []):
            n = len(proj.bullets or [])
            if n > 1 and (target is None or n > target[2]):
                target = ('project', i, n)

        if target is None:
            return False

        kind, idx, _ = target
        if kind == 'experience':
            resume.experience[idx].bullets = resume.experience[idx].bullets[:-1]
            print(f"  ✂ Trimmed last bullet from experience #{idx + 1} to fit one page")
        else:
            resume.projects[idx].bullets = resume.projects[idx].bullets[:-1]
            print(f"  ✂ Trimmed last bullet from project #{idx + 1} to fit one page")
        return True

    @staticmethod
    def _render_resume_to_path(resume: ResumeData, output_path: str, template: str = 'classic') -> bool:
        """Render a resume to a single PDF file. Returns True on success."""
        try:
            # ---- template-specific margins, styles, and column widths ----
            if template == 'modern':
                if PDFGenerator._resume_modern_styles is None:
                    PDFGenerator._resume_modern_styles = PDFGenerator._create_resume_modern_styles()
                styles = PDFGenerator._resume_modern_styles
                margins = dict(
                    topMargin=0.75 * inch,
                    bottomMargin=0.75 * inch,
                    leftMargin=1.0 * inch,
                    rightMargin=0.75 * inch
                )
                col_widths = dict(wide=5.0 * inch, narrow=1.75 * inch,
                                  proj_wide=5.25 * inch, proj_narrow=1.5 * inch)
                use_hr = False

            elif template == 'compact':
                if PDFGenerator._resume_compact_styles is None:
                    PDFGenerator._resume_compact_styles = PDFGenerator._create_resume_compact_styles()
                styles = PDFGenerator._resume_compact_styles
                margins = dict(
                    topMargin=0.45 * inch,
                    bottomMargin=0.45 * inch,
                    leftMargin=0.45 * inch,
                    rightMargin=0.45 * inch
                )
                col_widths = dict(wide=5.6 * inch, narrow=2.0 * inch,
                                  proj_wide=5.8 * inch, proj_narrow=1.8 * inch)
                use_hr = True

            else:  # classic (default)
                if PDFGenerator._resume_styles is None:
                    PDFGenerator._resume_styles = PDFGenerator._create_resume_styles()
                styles = PDFGenerator._resume_styles
                margins = dict(
                    topMargin=0.5 * inch,
                    bottomMargin=0.5 * inch,
                    leftMargin=0.5 * inch,
                    rightMargin=0.5 * inch
                )
                col_widths = dict(wide=5.5 * inch, narrow=2.0 * inch,
                                  proj_wide=5.5 * inch, proj_narrow=1.5 * inch)
                use_hr = True

            doc = SimpleDocTemplate(
                output_path,
                pagesize=letter,
                **margins
            )

            story = []

            # Header
            PDFGenerator._add_header(story, resume.header, styles)

            # Education
            if resume.education:
                PDFGenerator._add_education(story, resume.education, styles,
                                            template=template, col_widths=col_widths,
                                            use_hr=use_hr)

            # Experience
            if resume.experience:
                PDFGenerator._add_experience(story, resume.experience, styles,
                                             template=template, col_widths=col_widths,
                                             use_hr=use_hr)

            # Projects
            if resume.projects:
                PDFGenerator._add_projects(story, resume.projects, styles,
                                           template=template, col_widths=col_widths,
                                           use_hr=use_hr)

            # Skills
            if resume.skills:
                PDFGenerator._add_skills(story, resume.skills, styles,
                                         template=template, col_widths=col_widths,
                                         use_hr=use_hr)

            doc.build(story)
            return True

        except Exception as e:
            print(f"  ✗ Resume PDF generation failed: {e}")
            return False

    @staticmethod
    def generate_cover_letter_pdf(
            cover_letter: CoverLetter,
            header: Header,
            output_path: str,
            template: str = 'classic'
    ) -> bool:
        """
        Generate professional cover letter PDF.

        Args:
            cover_letter: Cover letter data
            header: Contact information
            output_path: Where to save PDF
            template: Visual template to use - 'classic', 'modern', or 'compact'

        Returns:
            True if successful, False otherwise
        """
        try:
            # ---- template-specific margins and styles ----
            if template == 'modern':
                if PDFGenerator._cover_letter_modern_styles is None:
                    PDFGenerator._cover_letter_modern_styles = PDFGenerator._create_cover_letter_modern_styles()
                styles = PDFGenerator._cover_letter_modern_styles
                margins = dict(
                    topMargin=0.75 * inch,
                    bottomMargin=0.75 * inch,
                    leftMargin=1.0 * inch,
                    rightMargin=0.75 * inch
                )

            elif template == 'compact':
                if PDFGenerator._cover_letter_compact_styles is None:
                    PDFGenerator._cover_letter_compact_styles = PDFGenerator._create_cover_letter_compact_styles()
                styles = PDFGenerator._cover_letter_compact_styles
                margins = dict(
                    topMargin=0.5 * inch,
                    bottomMargin=0.5 * inch,
                    leftMargin=0.5 * inch,
                    rightMargin=0.5 * inch
                )

            else:  # classic (default)
                if PDFGenerator._cover_letter_styles is None:
                    PDFGenerator._cover_letter_styles = PDFGenerator._create_cover_letter_styles()
                styles = PDFGenerator._cover_letter_styles
                margins = dict(
                    topMargin=0.75 * inch,
                    bottomMargin=0.75 * inch,
                    leftMargin=0.75 * inch,
                    rightMargin=0.75 * inch
                )

            doc = SimpleDocTemplate(
                output_path,
                pagesize=letter,
                **margins
            )

            story = []

            # Contact info
            story.append(Paragraph(header.name, styles['contact']))
            if header.email:
                story.append(Paragraph(header.email, styles['contact']))
            if header.phone:
                story.append(Paragraph(header.phone, styles['contact']))
            if header.location:
                story.append(Paragraph(header.location, styles['contact']))

            # Date
            today = datetime.now().strftime("%B %d, %Y")
            story.append(Paragraph(today, styles['date']))

            # Company info
            story.append(Paragraph("Hiring Manager", styles['company']))
            story.append(Paragraph(cover_letter.company_name, styles['company']))
            story.append(Paragraph(cover_letter.position, styles['company']))

            # Salutation
            story.append(Paragraph(
                f"Dear {cover_letter.hiring_manager},",
                styles['salutation']
            ))

            # Body
            for paragraph in cover_letter.paragraphs:
                clean_paragraph = clean_markdown_text(paragraph)
                story.append(Paragraph(clean_paragraph, styles['body']))

            # Closing
            story.append(Paragraph("Sincerely,", styles['closing']))
            story.append(Paragraph(header.name, styles['signature']))

            doc.build(story)
            print(f"  ✓ Cover letter PDF generated: {output_path}")
            return True

        except Exception as e:
            print(f"  ✗ Cover letter PDF generation failed: {e}")
            return False

    # ============================================================
    # PRIVATE HELPER METHODS
    # ============================================================

    @staticmethod
    def _create_resume_styles():
        """Create all paragraph styles for resume - classic (Jake's Resume Template) style"""
        return {
            'name': ParagraphStyle(
                'Name',
                fontName='Helvetica-Bold',
                fontSize=20,
                leading=24,
                alignment=TA_CENTER,
                spaceAfter=2,
                spaceBefore=0
            ),
            'contact': ParagraphStyle(
                'Contact',
                fontName='Helvetica',
                fontSize=9,
                leading=11,
                alignment=TA_CENTER,
                spaceAfter=6,
                spaceBefore=0
            ),
            'section': ParagraphStyle(
                'Section',
                fontName='Helvetica-Bold',
                fontSize=10,
                leading=12,
                spaceAfter=2,
                spaceBefore=8,
                alignment=TA_LEFT
            ),
            'title_bold': ParagraphStyle(
                'TitleBold',
                fontName='Helvetica-Bold',
                fontSize=10,
                leading=12,
                spaceAfter=0,
                spaceBefore=0
            ),
            'title_bold_right': ParagraphStyle(
                'TitleBoldRight',
                fontName='Helvetica-Bold',
                fontSize=10,
                leading=12,
                alignment=TA_RIGHT
            ),
            'body': ParagraphStyle(
                'Body',
                fontName='Helvetica',
                fontSize=10,
                leading=12,
                spaceAfter=0,
                spaceBefore=0
            ),
            'body_italic': ParagraphStyle(
                'BodyItalic',
                fontName='Helvetica-Oblique',
                fontSize=10,
                leading=12,
                spaceAfter=0,
                spaceBefore=0
            ),
            'body_right': ParagraphStyle(
                'BodyRight',
                fontName='Helvetica',
                fontSize=10,
                leading=12,
                alignment=TA_RIGHT
            ),
            'body_italic_right': ParagraphStyle(
                'BodyItalicRight',
                fontName='Helvetica-Oblique',
                fontSize=10,
                leading=12,
                alignment=TA_RIGHT
            ),
            'bullet': ParagraphStyle(
                'Bullet',
                fontName='Helvetica',
                fontSize=10,
                leading=12,
                leftIndent=12,
                spaceAfter=1,
                spaceBefore=0
            ),
            'skills_label': ParagraphStyle(
                'SkillsLabel',
                fontName='Helvetica-Bold',
                fontSize=10,
                leading=12,
                spaceAfter=0,
                spaceBefore=0
            )
        }

    @staticmethod
    def _create_resume_modern_styles():
        """Create all paragraph styles for resume - modern template (Times-Roman based)"""
        _dark_blue = colors.HexColor('#1a3a6b')
        return {
            'name': ParagraphStyle(
                'ModernName',
                fontName='Times-Bold',
                fontSize=22,
                leading=26,
                alignment=TA_LEFT,
                spaceAfter=2,
                spaceBefore=0
            ),
            'contact': ParagraphStyle(
                'ModernContact',
                fontName='Times-Roman',
                fontSize=9.5,
                leading=12,
                alignment=TA_LEFT,
                spaceAfter=6,
                spaceBefore=0
            ),
            'section': ParagraphStyle(
                'ModernSection',
                fontName='Times-Bold',
                fontSize=11,
                leading=14,
                spaceAfter=2,
                spaceBefore=10,
                alignment=TA_LEFT,
                textColor=_dark_blue
            ),
            'title_bold': ParagraphStyle(
                'ModernTitleBold',
                fontName='Times-Bold',
                fontSize=10.5,
                leading=13,
                spaceAfter=0,
                spaceBefore=0
            ),
            'title_bold_right': ParagraphStyle(
                'ModernTitleBoldRight',
                fontName='Times-Bold',
                fontSize=10.5,
                leading=13,
                alignment=TA_RIGHT
            ),
            'body': ParagraphStyle(
                'ModernBody',
                fontName='Times-Roman',
                fontSize=10.5,
                leading=13,
                spaceAfter=0,
                spaceBefore=0
            ),
            'body_italic': ParagraphStyle(
                'ModernBodyItalic',
                fontName='Times-Italic',
                fontSize=10.5,
                leading=13,
                spaceAfter=0,
                spaceBefore=0
            ),
            'body_right': ParagraphStyle(
                'ModernBodyRight',
                fontName='Times-Roman',
                fontSize=10.5,
                leading=13,
                alignment=TA_RIGHT
            ),
            'body_italic_right': ParagraphStyle(
                'ModernBodyItalicRight',
                fontName='Times-Italic',
                fontSize=10.5,
                leading=13,
                alignment=TA_RIGHT
            ),
            'bullet': ParagraphStyle(
                'ModernBullet',
                fontName='Times-Roman',
                fontSize=10.5,
                leading=13,
                leftIndent=14,
                spaceAfter=1,
                spaceBefore=0
            ),
            'skills_label': ParagraphStyle(
                'ModernSkillsLabel',
                fontName='Times-Bold',
                fontSize=10.5,
                leading=13,
                spaceAfter=0,
                spaceBefore=0
            )
        }

    @staticmethod
    def _create_resume_compact_styles():
        """Create all paragraph styles for resume - compact template (Helvetica, smaller sizes)"""
        return {
            'name': ParagraphStyle(
                'CompactName',
                fontName='Helvetica-Bold',
                fontSize=18,
                leading=22,
                alignment=TA_CENTER,
                spaceAfter=2,
                spaceBefore=0
            ),
            'contact': ParagraphStyle(
                'CompactContact',
                fontName='Helvetica',
                fontSize=8,
                leading=10,
                alignment=TA_CENTER,
                spaceAfter=4,
                spaceBefore=0
            ),
            'section': ParagraphStyle(
                'CompactSection',
                fontName='Helvetica-Bold',
                fontSize=9,
                leading=11,
                spaceAfter=1,
                spaceBefore=6,
                alignment=TA_LEFT
            ),
            'title_bold': ParagraphStyle(
                'CompactTitleBold',
                fontName='Helvetica-Bold',
                fontSize=9,
                leading=11,
                spaceAfter=0,
                spaceBefore=0
            ),
            'title_bold_right': ParagraphStyle(
                'CompactTitleBoldRight',
                fontName='Helvetica-Bold',
                fontSize=9,
                leading=11,
                alignment=TA_RIGHT
            ),
            'body': ParagraphStyle(
                'CompactBody',
                fontName='Helvetica',
                fontSize=9,
                leading=11,
                spaceAfter=0,
                spaceBefore=0
            ),
            'body_italic': ParagraphStyle(
                'CompactBodyItalic',
                fontName='Helvetica-Oblique',
                fontSize=9,
                leading=11,
                spaceAfter=0,
                spaceBefore=0
            ),
            'body_right': ParagraphStyle(
                'CompactBodyRight',
                fontName='Helvetica',
                fontSize=9,
                leading=11,
                alignment=TA_RIGHT
            ),
            'body_italic_right': ParagraphStyle(
                'CompactBodyItalicRight',
                fontName='Helvetica-Oblique',
                fontSize=9,
                leading=11,
                alignment=TA_RIGHT
            ),
            'bullet': ParagraphStyle(
                'CompactBullet',
                fontName='Helvetica',
                fontSize=9,
                leading=11,
                leftIndent=10,
                spaceAfter=1,
                spaceBefore=0
            ),
            'skills_label': ParagraphStyle(
                'CompactSkillsLabel',
                fontName='Helvetica-Bold',
                fontSize=9,
                leading=11,
                spaceAfter=0,
                spaceBefore=0
            )
        }

    @staticmethod
    def _create_cover_letter_styles():
        """Create all paragraph styles for cover letter - classic template"""
        base = ParagraphStyle('Base', fontName='Helvetica', fontSize=11, leading=14)

        return {
            'contact': ParagraphStyle('Contact', parent=base, alignment=TA_LEFT),
            'date': ParagraphStyle('Date', parent=base, spaceAfter=6, spaceBefore=12),
            'company': ParagraphStyle('Company', parent=base, spaceAfter=6),
            'salutation': ParagraphStyle('Salutation', parent=base, spaceAfter=12, spaceBefore=6),
            'body': ParagraphStyle('Body', parent=base, leading=16, spaceAfter=12),
            'closing': ParagraphStyle('Closing', parent=base, spaceAfter=36, spaceBefore=6),
            'signature': ParagraphStyle('Signature', parent=base)
        }

    @staticmethod
    def _create_cover_letter_modern_styles():
        """Create all paragraph styles for cover letter - modern template (Times-Roman 12pt)"""
        base = ParagraphStyle('ModernCLBase', fontName='Times-Roman', fontSize=12, leading=16)

        return {
            'contact': ParagraphStyle(
                'ModernCLContact',
                parent=base,
                fontName='Times-Bold',
                fontSize=13,
                leading=16,
                alignment=TA_LEFT
            ),
            'date': ParagraphStyle(
                'ModernCLDate',
                parent=base,
                spaceAfter=6,
                spaceBefore=12
            ),
            'company': ParagraphStyle(
                'ModernCLCompany',
                parent=base,
                spaceAfter=6
            ),
            'salutation': ParagraphStyle(
                'ModernCLSalutation',
                parent=base,
                spaceAfter=12,
                spaceBefore=6
            ),
            'body': ParagraphStyle(
                'ModernCLBody',
                parent=base,
                leading=18,
                spaceAfter=14
            ),
            'closing': ParagraphStyle(
                'ModernCLClosing',
                parent=base,
                spaceAfter=36,
                spaceBefore=6
            ),
            'signature': ParagraphStyle(
                'ModernCLSignature',
                parent=base
            )
        }

    @staticmethod
    def _create_cover_letter_compact_styles():
        """Create all paragraph styles for cover letter - compact template (Helvetica 10pt)"""
        base = ParagraphStyle('CompactCLBase', fontName='Helvetica', fontSize=10, leading=13)

        return {
            'contact': ParagraphStyle('CompactCLContact', parent=base, alignment=TA_LEFT),
            'date': ParagraphStyle('CompactCLDate', parent=base, spaceAfter=4, spaceBefore=8),
            'company': ParagraphStyle('CompactCLCompany', parent=base, spaceAfter=4),
            'salutation': ParagraphStyle('CompactCLSalutation', parent=base, spaceAfter=8, spaceBefore=4),
            'body': ParagraphStyle('CompactCLBody', parent=base, leading=14, spaceAfter=10),
            'closing': ParagraphStyle('CompactCLClosing', parent=base, spaceAfter=28, spaceBefore=4),
            'signature': ParagraphStyle('CompactCLSignature', parent=base)
        }

    @staticmethod
    def _add_header(story, header, styles):
        """Add header section to resume"""
        story.append(Paragraph(header.name, styles['name']))

        contact_parts = []
        for field in [header.phone, header.email, header.linkedin, header.github, header.location]:
            if field:
                # Clean URLs
                if field.startswith('http'):
                    field = field.replace('https://', '').replace('http://', '')
                contact_parts.append(field)

        if contact_parts:
            story.append(Paragraph(" | ".join(contact_parts), styles['contact']))

        story.append(Spacer(1, 0.05 * inch))

    @staticmethod
    def _add_education(story, education, styles, template='classic', col_widths=None, use_hr=True):
        """Add education section - supports classic, modern, and compact templates"""
        col_wide = col_widths['wide'] if col_widths else 5.5 * inch
        col_narrow = col_widths['narrow'] if col_widths else 2.0 * inch

        PDFGenerator._emit_section_header(story, "EDUCATION", styles, template, use_hr)

        for edu in education:
            # School (bold) | Location (italic) - first row
            row = [[
                Paragraph(edu.school, styles['title_bold']),
                Paragraph(edu.location or '', styles['body_italic_right'])
            ]]
            table = Table(row, colWidths=[col_wide, col_narrow])
            table.setStyle(PDFGenerator._table_style())
            story.append(table)

            # Degree (italic) | Grad Date - second row
            row = [[
                Paragraph(edu.degree, styles['body_italic']),
                Paragraph(edu.graduation_date, styles['body_right'])
            ]]
            table = Table(row, colWidths=[col_wide, col_narrow])
            table.setStyle(PDFGenerator._table_style())
            story.append(table)

            # GPA if present and above threshold
            if edu.gpa and edu.gpa >= MIN_GPA_DISPLAY:
                story.append(Paragraph(f"GPA: {edu.gpa:.2f}/4.0", styles['body']))

            spacer_height = 0.04 * inch if template == 'compact' else 0.06 * inch
            story.append(Spacer(1, spacer_height))

    @staticmethod
    def _add_experience(story, experience, styles, template='classic', col_widths=None, use_hr=True):
        """Add experience section - supports classic, modern, and compact templates"""
        col_wide = col_widths['wide'] if col_widths else 5.5 * inch
        col_narrow = col_widths['narrow'] if col_widths else 2.0 * inch

        PDFGenerator._emit_section_header(story, "EXPERIENCE", styles, template, use_hr)

        for exp in experience:
            # Title (bold) | Dates - first row
            row = [[
                Paragraph(exp.title, styles['title_bold']),
                Paragraph(f"{exp.start_date} - {exp.end_date}", styles['body_right'])
            ]]
            table = Table(row, colWidths=[col_wide, col_narrow])
            table.setStyle(PDFGenerator._table_style())
            story.append(table)

            # Company (italic) | Location (italic) - second row
            row = [[
                Paragraph(exp.company, styles['body_italic']),
                Paragraph(exp.location or '', styles['body_italic_right'])
            ]]
            table = Table(row, colWidths=[col_wide, col_narrow])
            table.setStyle(PDFGenerator._table_style())
            story.append(table)

            # Bullets
            for bullet in exp.bullets:
                clean_bullet = clean_markdown_text(bullet)
                story.append(Paragraph(f"• {clean_bullet}", styles['bullet']))

            spacer_height = 0.04 * inch if template == 'compact' else 0.06 * inch
            story.append(Spacer(1, spacer_height))

    @staticmethod
    def _add_projects(story, projects, styles, template='classic', col_widths=None, use_hr=True):
        """Add projects section - supports classic, modern, and compact templates"""
        proj_wide = col_widths['proj_wide'] if col_widths else 5.5 * inch
        proj_narrow = col_widths['proj_narrow'] if col_widths else 1.5 * inch

        PDFGenerator._emit_section_header(story, "PROJECTS", styles, template, use_hr)

        for proj in projects:
            tech_str = ", ".join(proj.technologies) if proj.technologies else ""

            # Project name (bold) | Technologies (italic) - using table for alignment
            if tech_str:
                row = [[
                    Paragraph(f"<b>{proj.name}</b> | <i>{tech_str}</i>", styles['body']),
                    Paragraph(proj.dates or '', styles['body_right'])
                ]]
            else:
                row = [[
                    Paragraph(f"<b>{proj.name}</b>", styles['body']),
                    Paragraph(proj.dates or '', styles['body_right'])
                ]]
            table = Table(row, colWidths=[proj_wide, proj_narrow])
            table.setStyle(PDFGenerator._table_style())
            story.append(table)

            for bullet in proj.bullets:
                clean_bullet = clean_markdown_text(bullet)
                story.append(Paragraph(f"• {clean_bullet}", styles['bullet']))

            spacer_height = 0.04 * inch if template == 'compact' else 0.06 * inch
            story.append(Spacer(1, spacer_height))

    @staticmethod
    def _add_skills(story, skills, styles, template='classic', col_widths=None, use_hr=True):
        """Add skills section - supports classic, modern, and compact templates"""
        PDFGenerator._emit_section_header(story, "TECHNICAL SKILLS", styles, template, use_hr)

        if skills.languages:
            story.append(Paragraph(
                f"<b>Languages:</b> {', '.join(skills.languages)}",
                styles['body']
            ))
        if skills.frameworks:
            story.append(Paragraph(
                f"<b>Frameworks:</b> {', '.join(skills.frameworks)}",
                styles['body']
            ))
        if skills.tools:
            story.append(Paragraph(
                f"<b>Developer Tools:</b> {', '.join(skills.tools)}",
                styles['body']
            ))
        if skills.other:
            story.append(Paragraph(
                f"<b>Libraries:</b> {', '.join(skills.other)}",
                styles['body']
            ))

    @staticmethod
    def _emit_section_header(story, title: str, styles, template: str, use_hr: bool):
        """
        Emit a section heading appropriate for the given template.

        - classic:  all-caps Helvetica-Bold 10pt paragraph + 1pt black HR
        - modern:   all-caps Times-Bold 11pt dark-blue paragraph, no HR
        - compact:  all-caps Helvetica-Bold 9pt paragraph + 0.5pt thin HR
        """
        story.append(Paragraph(title, styles['section']))
        if template == 'modern':
            # No horizontal rule for modern; dark-blue colour is set in the style
            pass
        elif template == 'compact':
            PDFGenerator._add_section_line_thin(story)
        else:
            # classic (and any unknown value)
            PDFGenerator._add_section_line(story)

    @staticmethod
    def _add_section_line(story):
        """Add 1pt horizontal line under section header - classic style"""
        from reportlab.platypus import HRFlowable
        story.append(HRFlowable(width="100%", thickness=1, color=colors.black, spaceBefore=1, spaceAfter=3))

    @staticmethod
    def _add_section_line_thin(story):
        """Add 0.5pt horizontal line under section header - compact style"""
        from reportlab.platypus import HRFlowable
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.black, spaceBefore=1, spaceAfter=3))

    @staticmethod
    def _table_style():
        """Standard table style for two-column layouts (cached)"""
        if PDFGenerator._table_style_cached is None:
            PDFGenerator._table_style_cached = TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ])
        return PDFGenerator._table_style_cached
