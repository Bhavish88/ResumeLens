"""
Gemini AI Service — the HEART of the project.

This module handles:
  1. Building a structured prompt for the resume analysis
  2. Calling Google Gemini API (using the new google-genai SDK)
  3. Parsing the AI response into structured JSON
  4. Returning clean, organized data

Why structured prompts?
  Sending "Analyze this resume" gives weak, unstructured output.
  We force Gemini to return a specific JSON format so we can:
    - Parse it reliably
    - Save each field to the database
    - Display it cleanly on the frontend

The prompt engineering here is what makes this project impressive.
"""

import json
import re
from google import genai
from google.genai import types
from django.conf import settings


def get_gemini_client():
    """Initialize and return the Gemini client."""
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise ValueError(
            'GEMINI_API_KEY is not set. Please add it to your .env file.'
        )
    client = genai.Client(api_key=api_key)
    return client


def build_analysis_prompt(resume_text: str, target_role: str) -> str:
    """
    Builds a structured prompt that forces Gemini to return
    a parseable JSON response.

    The key insight: by explicitly defining the JSON schema in the prompt,
    we get consistent, parseable output instead of free-form text.
    """
    prompt = f"""You are a professional ATS (Applicant Tracking System) resume analyzer with 10+ years of experience in technical recruitment.

Analyze the following resume for a **{target_role}** position.

Your task is to provide a detailed, honest analysis. Return your response ONLY as valid JSON — no markdown, no code blocks, no extra text before or after. Just pure JSON.

Required JSON format:
{{
  "ats_score": <integer between 1 and 100>,
  "missing_skills": [<list of specific technical skills missing for this role>],
  "strengths": [<list of resume strengths — be specific, not generic>],
  "weaknesses": [<list of weak sections or missing elements>],
  "suggestions": [<list of concrete, actionable improvement suggestions>],
  "final_verdict": "<2-3 sentence summary: overall impression and main recommendation>"
}}

Scoring guide for ats_score:
  90-100 : Excellent — very strong match for the role
  70-89  : Good — solid match with minor gaps
  50-69  : Average — noticeable skill gaps
  30-49  : Below average — significant improvements needed
  1-29   : Poor — major restructuring required

Resume to analyze:
---
{resume_text}
---

Remember: Return ONLY the JSON object. No explanation, no markdown formatting."""

    return prompt


def analyze_resume_with_gemini(resume_text: str, target_role: str) -> dict:
    """
    Main function to analyze a resume using Gemini AI.

    Args:
        resume_text : Cleaned text extracted from the PDF
        target_role : Job role the user is targeting

    Returns:
        A dictionary with the structured analysis result:
        {
            "ats_score": int,
            "missing_skills": list[str],
            "strengths": list[str],
            "weaknesses": list[str],
            "suggestions": list[str],
            "final_verdict": str,
            "full_ai_response": str,   <- the raw Gemini output
            "error": None or str       <- error message if something fails
        }
    """
    result = {
        'ats_score': 0,
        'missing_skills': [],
        'strengths': [],
        'weaknesses': [],
        'suggestions': [],
        'final_verdict': '',
        'full_ai_response': '',
        'error': None,
    }

    try:
        # Validate inputs
        if not resume_text or len(resume_text.strip()) < 50:
            result['error'] = (
                'Resume text is too short to analyze. '
                'Please ensure your PDF contains readable text.'
            )
            return result

        # Build the structured prompt
        prompt = build_analysis_prompt(resume_text, target_role)

        # Call Gemini API using new google-genai SDK
        client = get_gemini_client()
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,        # Lower = more consistent, less creative
                max_output_tokens=2048,
            ),
        )

        raw_response = response.text
        result['full_ai_response'] = raw_response

        # Parse the JSON response
        parsed = _parse_gemini_response(raw_response)
        result.update(parsed)

    except ValueError as e:
        result['error'] = str(e)
    except Exception as e:
        result['error'] = f'AI analysis failed: {str(e)}'
        print(f'[GeminiService] Unexpected error: {e}')

    return result


def _parse_gemini_response(raw_response: str) -> dict:
    """
    Parse Gemini's raw text response into structured data.

    Gemini sometimes wraps JSON in markdown code blocks like ```json ... ```
    This function handles that case and falls back gracefully.
    """
    default = {
        'ats_score': 0,
        'missing_skills': [],
        'strengths': [],
        'weaknesses': [],
        'suggestions': [],
        'final_verdict': 'Analysis could not be parsed. Please try again.',
    }

    if not raw_response:
        return default

    try:
        # Try to extract JSON from markdown code blocks first
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', raw_response)
        if json_match:
            json_str = json_match.group(1)
        else:
            # Try to find raw JSON object
            json_match = re.search(r'\{[\s\S]*\}', raw_response)
            if json_match:
                json_str = json_match.group(0)
            else:
                json_str = raw_response

        data = json.loads(json_str)

        return {
            'ats_score': _safe_int(data.get('ats_score', 0), 0, 100),
            'missing_skills': _safe_list(data.get('missing_skills', [])),
            'strengths': _safe_list(data.get('strengths', [])),
            'weaknesses': _safe_list(data.get('weaknesses', [])),
            'suggestions': _safe_list(data.get('suggestions', [])),
            'final_verdict': str(data.get('final_verdict', '')),
        }

    except (json.JSONDecodeError, AttributeError, TypeError) as e:
        print(f'[GeminiService] JSON parse error: {e}')
        print(f'[GeminiService] Raw response was: {raw_response[:500]}')
        return default


def _safe_int(value, min_val=0, max_val=100) -> int:
    """Safely convert value to int, clamped between min and max."""
    try:
        return max(min_val, min(max_val, int(value)))
    except (TypeError, ValueError):
        return 0


def _safe_list(value) -> list:
    """Ensure value is a list of strings."""
    if isinstance(value, list):
        return [str(item) for item in value if item]
    if isinstance(value, str):
        return [value] if value else []
    return []
