"""
PDF text extraction utility using pdfplumber.

Flow:
  PDF file → open with pdfplumber → extract text per page
           → combine all pages → clean whitespace → return cleaned text

pdfplumber is used because it handles complex PDFs (columns, tables)
better than PyPDF2, giving cleaner text for AI analysis.
"""

import pdfplumber
import re


def extract_text_from_pdf(file_obj) -> str:
    """
    Extract and clean text from an uploaded PDF file object.

    Args:
        file_obj: An in-memory file object (Django InMemoryUploadedFile or
                  TemporaryUploadedFile) or a file path string.

    Returns:
        A cleaned string of all text found in the PDF.
        Returns empty string if extraction fails.
    """
    try:
        all_text = []

        with pdfplumber.open(file_obj) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    all_text.append(page_text)

        # Combine all pages
        raw_text = '\n'.join(all_text)

        # Clean the text
        cleaned_text = _clean_text(raw_text)
        return cleaned_text

    except Exception as e:
        print(f'[PDFExtractor] Error extracting text: {e}')
        return ''


def _clean_text(text: str) -> str:
    """
    Clean extracted PDF text:
      - Remove excessive whitespace lines
      - Normalize multiple spaces to single space
      - Remove non-printable characters (but keep common symbols)
      - Strip leading/trailing whitespace
    """
    if not text:
        return ''

    # Replace multiple blank lines with a single newline
    text = re.sub(r'\n\s*\n+', '\n\n', text)

    # Replace multiple spaces/tabs with single space
    text = re.sub(r'[ \t]+', ' ', text)

    # Remove non-printable chars except common ones
    text = re.sub(r'[^\x20-\x7E\n]', ' ', text)

    # Final strip
    text = text.strip()

    return text
