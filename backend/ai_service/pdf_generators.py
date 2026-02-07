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
    - Future: Multiple template styles
    """

    # Cache styles as class variables (created once, reused forever)
    _resume_styles = None
    _cover_letter_styles = None
    _table_style_cached = None

    @staticmethod
    def generate_resume_pdf(resume: ResumeData, output_path: str) -> bool:
        """
        Generate ATS-friendly resume PDF matching Jake's Resume Template.

        Args:
            resume: Resume data to render
            output_path: Where to save PDF

        Returns:
            True if successful, False otherwise
        """
        try:
            import time
            start_time = time.time()

            doc = SimpleDocTemplate(
                output_path,
                pagesize=letter,
                topMargin=0.5 * inch,
                bottomMargin=0.5 * inch,
                leftMargin=0.5 * inch,
                rightMargin=0.5 * inch
            )

            story = []
            # Use cached styles (huge performance boost)
            if PDFGenerator._resume_styles is None:
                PDFGenerator._resume_styles = PDFGenerator._create_resume_styles()
            styles = PDFGenerator._resume_styles

            # Header
            PDFGenerator._add_header(story, resume.header, styles)

            # Education
            if resume.education:
                PDFGenerator._add_education(story, resume.education, styles)

            # Experience
            if resume.experience:
                PDFGenerator._add_experience(story, resume.experience, styles)

            # Projects
            if resume.projects:
                PDFGenerator._add_projects(story, resume.projects, styles)

            # Skills
            if resume.skills:
                PDFGenerator._add_skills(story, resume.skills, styles)

            doc.build(story)
            pdf_time = time.time() - start_time
            print(f"  ✓ Resume PDF generated in {pdf_time:.1f}s: {output_path}")
            return True

        except Exception as e:
            print(f"  ✗ Resume PDF generation failed: {e}")
            return False

    @staticmethod
    def generate_cover_letter_pdf(
            cover_letter: CoverLetter,
            header: Header,
            output_path: str
    ) -> bool:
        """
        Generate professional cover letter PDF.

        Args:
            cover_letter: Cover letter data
            header: Contact information
            output_path: Where to save PDF

        Returns:
            True if successful, False otherwise
        """
        try:
            doc = SimpleDocTemplate(
                output_path,
                pagesize=letter,
                topMargin=0.75 * inch,
                bottomMargin=0.75 * inch,
                leftMargin=0.75 * inch,
                rightMargin=0.75 * inch
            )

            story = []
            # Use cached styles (huge performance boost)
            if PDFGenerator._cover_letter_styles is None:
                PDFGenerator._cover_letter_styles = PDFGenerator._create_cover_letter_styles()
            styles = PDFGenerator._cover_letter_styles

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
        """Create all paragraph styles for resume - Jake's Resume Template style"""
        return {
            'name': ParagraphStyle(
                'Name',
                fontName='Helvetica-Bold',
                fontSize=24,
                leading=28,
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
    def _create_cover_letter_styles():
        """Create all paragraph styles for cover letter"""
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
    def _add_education(story, education, styles):
        """Add education section - Jake's Resume style"""
        story.append(Paragraph("EDUCATION", styles['section']))
        PDFGenerator._add_section_line(story)

        for edu in education:
            # School (bold) | Location (italic) - first row
            row = [[
                Paragraph(edu.school, styles['title_bold']),
                Paragraph(edu.location or '', styles['body_italic_right'])
            ]]
            table = Table(row, colWidths=[5 * inch, 2 * inch])
            table.setStyle(PDFGenerator._table_style())
            story.append(table)

            # Degree (italic) | Grad Date - second row
            row = [[
                Paragraph(edu.degree, styles['body_italic']),
                Paragraph(edu.graduation_date, styles['body_right'])
            ]]
            table = Table(row, colWidths=[5 * inch, 2 * inch])
            table.setStyle(PDFGenerator._table_style())
            story.append(table)

            # GPA if present and above threshold
            if edu.gpa and edu.gpa >= MIN_GPA_DISPLAY:
                story.append(Paragraph(f"GPA: {edu.gpa:.2f}/4.0", styles['body']))

            story.append(Spacer(1, 0.06 * inch))

    @staticmethod
    def _add_experience(story, experience, styles):
        """Add experience section - Jake's Resume style"""
        story.append(Paragraph("EXPERIENCE", styles['section']))
        PDFGenerator._add_section_line(story)

        for exp in experience:
            # Title (bold) | Dates - first row
            row = [[
                Paragraph(exp.title, styles['title_bold']),
                Paragraph(f"{exp.start_date} - {exp.end_date}", styles['body_right'])
            ]]
            table = Table(row, colWidths=[5 * inch, 2 * inch])
            table.setStyle(PDFGenerator._table_style())
            story.append(table)

            # Company (italic) | Location (italic) - second row
            row = [[
                Paragraph(exp.company, styles['body_italic']),
                Paragraph(exp.location or '', styles['body_italic_right'])
            ]]
            table = Table(row, colWidths=[5 * inch, 2 * inch])
            table.setStyle(PDFGenerator._table_style())
            story.append(table)

            # Bullets
            for bullet in exp.bullets:
                clean_bullet = clean_markdown_text(bullet)
                story.append(Paragraph(f"• {clean_bullet}", styles['bullet']))

            story.append(Spacer(1, 0.06 * inch))

    @staticmethod
    def _add_projects(story, projects, styles):
        """Add projects section - Jake's Resume style"""
        story.append(Paragraph("PROJECTS", styles['section']))
        PDFGenerator._add_section_line(story)

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
            table = Table(row, colWidths=[5.5 * inch, 1.5 * inch])
            table.setStyle(PDFGenerator._table_style())
            story.append(table)

            for bullet in proj.bullets:
                clean_bullet = clean_markdown_text(bullet)
                story.append(Paragraph(f"• {clean_bullet}", styles['bullet']))

            story.append(Spacer(1, 0.06 * inch))

    @staticmethod
    def _add_skills(story, skills, styles):
        """Add skills section - Jake's Resume style with bold labels"""
        story.append(Paragraph("TECHNICAL SKILLS", styles['section']))
        PDFGenerator._add_section_line(story)

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
    def _add_section_line(story):
        """Add horizontal line under section header - Jake's Resume style"""
        from reportlab.platypus import HRFlowable
        story.append(HRFlowable(width="100%", thickness=1, color=colors.black, spaceBefore=1, spaceAfter=3))

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