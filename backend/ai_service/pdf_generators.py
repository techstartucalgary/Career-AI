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


# ---------------------------------------------------------------------------
# Per-template layout constants
# ---------------------------------------------------------------------------

_TEMPLATE_CONFIG = {
    'classic': {
        # Margins: (top, bottom, left, right) in inches
        'margins': (0.75, 0.75, 0.75, 0.75),
        # Table column widths for two-column rows (must sum to usable width)
        # usable = 8.5 - left(0.75) - right(0.75) = 7.0 inches
        'col_wide': 5.0,
        'col_narrow': 2.0,
        'col_proj_wide': 5.5,
        'col_proj_narrow': 1.5,
    },
    'modern': {
        # Wider left margin for a document-like feel
        'margins': (0.75, 0.75, 1.0, 0.75),
        # usable = 8.5 - left(1.0) - right(0.75) = 6.75 inches
        'col_wide': 4.75,
        'col_narrow': 2.0,
        'col_proj_wide': 5.25,
        'col_proj_narrow': 1.5,
    },
    'compact': {
        # Tight margins to squeeze more content
        'margins': (0.5, 0.5, 0.5, 0.5),
        # usable = 8.5 - left(0.5) - right(0.5) = 7.5 inches
        'col_wide': 5.5,
        'col_narrow': 2.0,
        'col_proj_wide': 6.0,
        'col_proj_narrow': 1.5,
    },
}


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
    _resume_modern_styles = None
    _resume_compact_styles = None
    _cover_letter_styles = None
    _cover_letter_modern_styles = None
    _cover_letter_compact_styles = None
    _table_style_cached = None

    @staticmethod
    def generate_resume_pdf(resume: ResumeData, output_path: str, template: str = 'classic') -> bool:
        """
        Generate ATS-friendly resume PDF.

        Args:
            resume: Resume data to render
            output_path: Where to save PDF
            template: 'classic' (Jake/Helvetica), 'modern' (Times-Roman, left-aligned),
                      or 'compact' (smaller fonts, tighter margins)

        Returns:
            True if successful, False otherwise
        """
        try:
            import time
            start_time = time.time()

            cfg = _TEMPLATE_CONFIG.get(template, _TEMPLATE_CONFIG['classic'])
            m = cfg['margins']

            doc = SimpleDocTemplate(
                output_path,
                pagesize=letter,
                topMargin=m[0] * inch,
                bottomMargin=m[1] * inch,
                leftMargin=m[2] * inch,
                rightMargin=m[3] * inch,
            )

            story = []

            # Select and cache styles for the chosen template
            if template == 'modern':
                if PDFGenerator._resume_modern_styles is None:
                    PDFGenerator._resume_modern_styles = PDFGenerator._create_modern_resume_styles()
                styles = PDFGenerator._resume_modern_styles
            elif template == 'compact':
                if PDFGenerator._resume_compact_styles is None:
                    PDFGenerator._resume_compact_styles = PDFGenerator._create_compact_resume_styles()
                styles = PDFGenerator._resume_compact_styles
            else:
                if PDFGenerator._resume_styles is None:
                    PDFGenerator._resume_styles = PDFGenerator._create_resume_styles()
                styles = PDFGenerator._resume_styles

            PDFGenerator._add_header(story, resume.header, styles, template)
            if resume.education:
                PDFGenerator._add_education(story, resume.education, styles, template, cfg)
            if resume.experience:
                PDFGenerator._add_experience(story, resume.experience, styles, template, cfg)
            if resume.projects:
                PDFGenerator._add_projects(story, resume.projects, styles, template, cfg)
            if resume.skills:
                PDFGenerator._add_skills(story, resume.skills, styles, template)

            doc.build(story)
            pdf_time = time.time() - start_time
            print(f"  + Resume PDF ({template}) generated in {pdf_time:.1f}s: {output_path}")
            return True

        except Exception as e:
            print(f"  x Resume PDF generation failed: {e}")
            return False

    @staticmethod
    def generate_cover_letter_pdf(
            cover_letter: CoverLetter,
            header: Header,
            output_path: str,
            template: str = 'classic',
    ) -> bool:
        """
        Generate professional cover letter PDF.

        Args:
            cover_letter: Cover letter data
            header: Contact information
            output_path: Where to save PDF
            template: 'classic', 'modern', or 'compact'

        Returns:
            True if successful, False otherwise
        """
        try:
            _margins = {
                'modern':  (0.85, 0.85, 0.85, 0.85),
                'compact': (0.6,  0.6,  0.65, 0.65),
            }.get(template, (0.75, 0.75, 0.75, 0.75))

            doc = SimpleDocTemplate(
                output_path,
                pagesize=letter,
                topMargin=_margins[0] * inch,
                bottomMargin=_margins[1] * inch,
                leftMargin=_margins[2] * inch,
                rightMargin=_margins[3] * inch,
            )

            story = []
            if template == 'modern':
                if PDFGenerator._cover_letter_modern_styles is None:
                    PDFGenerator._cover_letter_modern_styles = PDFGenerator._create_modern_cover_letter_styles()
                styles = PDFGenerator._cover_letter_modern_styles
            elif template == 'compact':
                if PDFGenerator._cover_letter_compact_styles is None:
                    PDFGenerator._cover_letter_compact_styles = PDFGenerator._create_compact_cover_letter_styles()
                styles = PDFGenerator._cover_letter_compact_styles
            else:
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
            print(f"  + Cover letter PDF generated: {output_path}")
            return True

        except Exception as e:
            print(f"  x Cover letter PDF generation failed: {e}")
            return False

    # ============================================================
    # PRIVATE STYLE FACTORIES
    # ============================================================

    @staticmethod
    def _create_resume_styles():
        """
        Classic resume styles.
        - Font: Helvetica
        - Name: centered, 20pt bold
        - Section headers: all-caps, horizontal rule below
        - Margins: 0.75 inch (set in generate_resume_pdf)
        """
        return {
            'name': ParagraphStyle(
                'Name',
                fontName='Helvetica-Bold',
                fontSize=20,
                leading=24,
                alignment=TA_CENTER,
                spaceAfter=2,
                spaceBefore=0,
            ),
            'contact': ParagraphStyle(
                'Contact',
                fontName='Helvetica',
                fontSize=9,
                leading=11,
                alignment=TA_CENTER,
                spaceAfter=4,
                spaceBefore=0,
            ),
            'section': ParagraphStyle(
                'Section',
                fontName='Helvetica-Bold',
                fontSize=10,
                leading=12,
                spaceAfter=2,
                spaceBefore=8,
                alignment=TA_LEFT,
            ),
            'title_bold': ParagraphStyle(
                'TitleBold',
                fontName='Helvetica-Bold',
                fontSize=10,
                leading=12,
                spaceAfter=0,
                spaceBefore=0,
            ),
            'title_bold_right': ParagraphStyle(
                'TitleBoldRight',
                fontName='Helvetica-Bold',
                fontSize=10,
                leading=12,
                alignment=TA_RIGHT,
            ),
            'body': ParagraphStyle(
                'Body',
                fontName='Helvetica',
                fontSize=10,
                leading=12,
                spaceAfter=0,
                spaceBefore=0,
            ),
            'body_italic': ParagraphStyle(
                'BodyItalic',
                fontName='Helvetica-Oblique',
                fontSize=10,
                leading=12,
                spaceAfter=0,
                spaceBefore=0,
            ),
            'body_right': ParagraphStyle(
                'BodyRight',
                fontName='Helvetica',
                fontSize=10,
                leading=12,
                alignment=TA_RIGHT,
            ),
            'body_italic_right': ParagraphStyle(
                'BodyItalicRight',
                fontName='Helvetica-Oblique',
                fontSize=10,
                leading=12,
                alignment=TA_RIGHT,
            ),
            'bullet': ParagraphStyle(
                'Bullet',
                fontName='Helvetica',
                fontSize=10,
                leading=12,
                leftIndent=12,
                spaceAfter=1,
                spaceBefore=0,
            ),
            'skills_label': ParagraphStyle(
                'SkillsLabel',
                fontName='Helvetica-Bold',
                fontSize=10,
                leading=12,
                spaceAfter=0,
                spaceBefore=0,
            ),
        }

    @staticmethod
    def _create_cover_letter_styles():
        """Create all paragraph styles for cover letter - Classic (Helvetica)"""
        base = ParagraphStyle('Base', fontName='Helvetica', fontSize=11, leading=14)

        return {
            'contact': ParagraphStyle('Contact', parent=base, alignment=TA_LEFT),
            'date': ParagraphStyle('Date', parent=base, spaceAfter=6, spaceBefore=12),
            'company': ParagraphStyle('Company', parent=base, spaceAfter=6),
            'salutation': ParagraphStyle('Salutation', parent=base, spaceAfter=12, spaceBefore=6),
            'body': ParagraphStyle('Body', parent=base, leading=16, spaceAfter=12),
            'closing': ParagraphStyle('Closing', parent=base, spaceAfter=36, spaceBefore=6),
            'signature': ParagraphStyle('Signature', parent=base),
        }

    @staticmethod
    def _create_modern_resume_styles():
        """
        Modern resume styles.
        - Font: Times-Roman / Times-Bold
        - Name: LEFT-aligned, 22pt bold
        - Section headers: colored dark-gray text, extra spacing above (NO horizontal rule)
        - Body text: 10.5pt
        - Left margin: 1.0 inch (set in generate_resume_pdf)
        """
        return {
            'name': ParagraphStyle(
                'NameMod',
                fontName='Times-Bold',
                fontSize=22,
                leading=26,
                alignment=TA_LEFT,
                spaceAfter=2,
                spaceBefore=0,
            ),
            'contact': ParagraphStyle(
                'ContactMod',
                fontName='Times-Roman',
                fontSize=9.5,
                leading=12,
                alignment=TA_LEFT,
                spaceAfter=6,
                spaceBefore=0,
            ),
            # Section header: colored, no rule - spaceBefore creates visual separation
            'section': ParagraphStyle(
                'SectionMod',
                fontName='Times-Bold',
                fontSize=11,
                leading=13,
                spaceAfter=4,
                spaceBefore=12,
                alignment=TA_LEFT,
                textColor=colors.HexColor('#2C3E50'),
            ),
            'title_bold': ParagraphStyle(
                'TBMod',
                fontName='Times-Bold',
                fontSize=10.5,
                leading=13,
                spaceAfter=0,
                spaceBefore=0,
            ),
            'title_bold_right': ParagraphStyle(
                'TBRMod',
                fontName='Times-Bold',
                fontSize=10.5,
                leading=13,
                alignment=TA_RIGHT,
            ),
            'body': ParagraphStyle(
                'BodyMod',
                fontName='Times-Roman',
                fontSize=10.5,
                leading=14,
                spaceAfter=0,
                spaceBefore=0,
            ),
            'body_italic': ParagraphStyle(
                'BIMod',
                fontName='Times-Italic',
                fontSize=10.5,
                leading=14,
                spaceAfter=0,
                spaceBefore=0,
            ),
            'body_right': ParagraphStyle(
                'BRMod',
                fontName='Times-Roman',
                fontSize=10.5,
                leading=14,
                alignment=TA_RIGHT,
            ),
            'body_italic_right': ParagraphStyle(
                'BIRMod',
                fontName='Times-Italic',
                fontSize=10.5,
                leading=14,
                alignment=TA_RIGHT,
            ),
            'bullet': ParagraphStyle(
                'BulletMod',
                fontName='Times-Roman',
                fontSize=10.5,
                leading=14,
                leftIndent=12,
                spaceAfter=1,
                spaceBefore=0,
            ),
            'skills_label': ParagraphStyle(
                'SLMod',
                fontName='Times-Bold',
                fontSize=10.5,
                leading=14,
                spaceAfter=0,
                spaceBefore=0,
            ),
        }

    @staticmethod
    def _create_compact_resume_styles():
        """
        Compact resume styles.
        - Font: Helvetica at small sizes
        - Name: centered, 18pt bold
        - Body: 9pt, tighter leading
        - Margins: 0.5 inch (set in generate_resume_pdf)
        - Section headers: all-caps with horizontal rule (same as classic but smaller)
        """
        return {
            'name': ParagraphStyle(
                'NameCmp',
                fontName='Helvetica-Bold',
                fontSize=18,
                leading=21,
                alignment=TA_CENTER,
                spaceAfter=1,
                spaceBefore=0,
            ),
            'contact': ParagraphStyle(
                'ContactCmp',
                fontName='Helvetica',
                fontSize=8,
                leading=9,
                alignment=TA_CENTER,
                spaceAfter=3,
                spaceBefore=0,
            ),
            'section': ParagraphStyle(
                'SectionCmp',
                fontName='Helvetica-Bold',
                fontSize=9,
                leading=10,
                spaceAfter=1,
                spaceBefore=5,
                alignment=TA_LEFT,
            ),
            'title_bold': ParagraphStyle(
                'TBCmp',
                fontName='Helvetica-Bold',
                fontSize=9,
                leading=10,
                spaceAfter=0,
                spaceBefore=0,
            ),
            'title_bold_right': ParagraphStyle(
                'TBRCmp',
                fontName='Helvetica-Bold',
                fontSize=9,
                leading=10,
                alignment=TA_RIGHT,
            ),
            'body': ParagraphStyle(
                'BodyCmp',
                fontName='Helvetica',
                fontSize=9,
                leading=10,
                spaceAfter=0,
                spaceBefore=0,
            ),
            'body_italic': ParagraphStyle(
                'BICmp',
                fontName='Helvetica-Oblique',
                fontSize=9,
                leading=10,
                spaceAfter=0,
                spaceBefore=0,
            ),
            'body_right': ParagraphStyle(
                'BRCmp',
                fontName='Helvetica',
                fontSize=9,
                leading=10,
                alignment=TA_RIGHT,
            ),
            'body_italic_right': ParagraphStyle(
                'BIRCmp',
                fontName='Helvetica-Oblique',
                fontSize=9,
                leading=10,
                alignment=TA_RIGHT,
            ),
            'bullet': ParagraphStyle(
                'BulletCmp',
                fontName='Helvetica',
                fontSize=9,
                leading=10,
                leftIndent=10,
                spaceAfter=0,
                spaceBefore=0,
            ),
            'skills_label': ParagraphStyle(
                'SLCmp',
                fontName='Helvetica-Bold',
                fontSize=9,
                leading=10,
                spaceAfter=0,
                spaceBefore=0,
            ),
        }

    @staticmethod
    def _create_modern_cover_letter_styles():
        """Modern cover letter - Times-Roman serif, slightly more formal spacing"""
        base = ParagraphStyle('CLBaseMod', fontName='Times-Roman', fontSize=11, leading=15)
        return {
            'contact': ParagraphStyle('CLContactMod', parent=base, alignment=TA_LEFT),
            'date': ParagraphStyle('CLDateMod', parent=base, spaceAfter=8, spaceBefore=14),
            'company': ParagraphStyle('CLCompanyMod', parent=base, spaceAfter=6),
            'salutation': ParagraphStyle('CLSalutMod', parent=base, spaceAfter=14, spaceBefore=8),
            'body': ParagraphStyle('CLBodyMod', parent=base, leading=18, spaceAfter=14),
            'closing': ParagraphStyle('CLClosingMod', parent=base, spaceAfter=40, spaceBefore=8),
            'signature': ParagraphStyle('CLSigMod', parent=base),
        }

    @staticmethod
    def _create_compact_cover_letter_styles():
        """Compact cover letter - Helvetica at 10pt, tighter spacing"""
        base = ParagraphStyle('CLBaseCmp', fontName='Helvetica', fontSize=10, leading=13)
        return {
            'contact': ParagraphStyle('CLContactCmp', parent=base, alignment=TA_LEFT),
            'date': ParagraphStyle('CLDateCmp', parent=base, spaceAfter=4, spaceBefore=10),
            'company': ParagraphStyle('CLCompanyCmp', parent=base, spaceAfter=4),
            'salutation': ParagraphStyle('CLSalutCmp', parent=base, spaceAfter=10, spaceBefore=4),
            'body': ParagraphStyle('CLBodyCmp', parent=base, leading=14, spaceAfter=10),
            'closing': ParagraphStyle('CLClosingCmp', parent=base, spaceAfter=28, spaceBefore=4),
            'signature': ParagraphStyle('CLSigCmp', parent=base),
        }

    # ============================================================
    # PRIVATE SECTION-RENDERING HELPERS
    # ============================================================

    @staticmethod
    def _add_header(story, header, styles, template='classic'):
        """Add header section to resume."""
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

        # Modern uses more generous top spacing; compact saves vertical space
        gap = {
            'modern': 0.08,
            'compact': 0.03,
        }.get(template, 0.05)
        story.append(Spacer(1, gap * inch))

    @staticmethod
    def _add_section_header(story, title, styles, template):
        """
        Render a section header according to the active template.

        - classic / compact: all-caps label + horizontal rule below
        - modern: colored bold label, no rule, relies on spaceBefore in the style
        """
        story.append(Paragraph(title.upper(), styles['section']))
        if template != 'modern':
            PDFGenerator._add_section_line(story, template)

    @staticmethod
    def _add_education(story, education, styles, template, cfg):
        """Add education section."""
        PDFGenerator._add_section_header(story, "EDUCATION", styles, template)

        for edu in education:
            row = [[
                Paragraph(edu.school, styles['title_bold']),
                Paragraph(edu.location or '', styles['body_italic_right']),
            ]]
            table = Table(row, colWidths=[cfg['col_wide'] * inch, cfg['col_narrow'] * inch])
            table.setStyle(PDFGenerator._table_style())
            story.append(table)

            row = [[
                Paragraph(edu.degree, styles['body_italic']),
                Paragraph(edu.graduation_date, styles['body_right']),
            ]]
            table = Table(row, colWidths=[cfg['col_wide'] * inch, cfg['col_narrow'] * inch])
            table.setStyle(PDFGenerator._table_style())
            story.append(table)

            if edu.gpa and edu.gpa >= MIN_GPA_DISPLAY:
                story.append(Paragraph(f"GPA: {edu.gpa:.2f}/4.0", styles['body']))

            gap = 0.04 if template == 'compact' else 0.06
            story.append(Spacer(1, gap * inch))

    @staticmethod
    def _add_experience(story, experience, styles, template, cfg):
        """Add experience section."""
        PDFGenerator._add_section_header(story, "EXPERIENCE", styles, template)

        for exp in experience:
            row = [[
                Paragraph(exp.title, styles['title_bold']),
                Paragraph(f"{exp.start_date} - {exp.end_date}", styles['body_right']),
            ]]
            table = Table(row, colWidths=[cfg['col_wide'] * inch, cfg['col_narrow'] * inch])
            table.setStyle(PDFGenerator._table_style())
            story.append(table)

            row = [[
                Paragraph(exp.company, styles['body_italic']),
                Paragraph(exp.location or '', styles['body_italic_right']),
            ]]
            table = Table(row, colWidths=[cfg['col_wide'] * inch, cfg['col_narrow'] * inch])
            table.setStyle(PDFGenerator._table_style())
            story.append(table)

            for bullet in exp.bullets:
                clean_bullet = clean_markdown_text(bullet)
                story.append(Paragraph(f"• {clean_bullet}", styles['bullet']))

            gap = 0.04 if template == 'compact' else 0.06
            story.append(Spacer(1, gap * inch))

    @staticmethod
    def _add_projects(story, projects, styles, template, cfg):
        """Add projects section."""
        PDFGenerator._add_section_header(story, "PROJECTS", styles, template)

        for proj in projects:
            tech_str = ", ".join(proj.technologies) if proj.technologies else ""

            if tech_str:
                row = [[
                    Paragraph(f"<b>{proj.name}</b> | <i>{tech_str}</i>", styles['body']),
                    Paragraph(proj.dates or '', styles['body_right']),
                ]]
            else:
                row = [[
                    Paragraph(f"<b>{proj.name}</b>", styles['body']),
                    Paragraph(proj.dates or '', styles['body_right']),
                ]]
            table = Table(row, colWidths=[cfg['col_proj_wide'] * inch, cfg['col_proj_narrow'] * inch])
            table.setStyle(PDFGenerator._table_style())
            story.append(table)

            for bullet in proj.bullets:
                clean_bullet = clean_markdown_text(bullet)
                story.append(Paragraph(f"• {clean_bullet}", styles['bullet']))

            gap = 0.04 if template == 'compact' else 0.06
            story.append(Spacer(1, gap * inch))

    @staticmethod
    def _add_skills(story, skills, styles, template):
        """Add skills section."""
        PDFGenerator._add_section_header(story, "TECHNICAL SKILLS", styles, template)

        if skills.languages:
            story.append(Paragraph(
                f"<b>Languages:</b> {', '.join(skills.languages)}",
                styles['body'],
            ))
        if skills.frameworks:
            story.append(Paragraph(
                f"<b>Frameworks:</b> {', '.join(skills.frameworks)}",
                styles['body'],
            ))
        if skills.tools:
            story.append(Paragraph(
                f"<b>Developer Tools:</b> {', '.join(skills.tools)}",
                styles['body'],
            ))
        if skills.other:
            story.append(Paragraph(
                f"<b>Libraries:</b> {', '.join(skills.other)}",
                styles['body'],
            ))

    @staticmethod
    def _add_section_line(story, template='classic'):
        """Add horizontal rule under section header (classic and compact only)."""
        from reportlab.platypus import HRFlowable
        thickness = 0.5 if template == 'compact' else 1
        story.append(HRFlowable(
            width="100%",
            thickness=thickness,
            color=colors.black,
            spaceBefore=1,
            spaceAfter=3,
        ))

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
