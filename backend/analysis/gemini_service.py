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
    a detailed parseable JSON response including category scores and ATS recommendations.
    """
    prompt = f"""You are a professional ATS (Applicant Tracking System) resume analyzer and technical recruiter with 10+ years of experience.

Analyze the following resume strictly for a **{target_role}** position.

Your task is to provide a highly tailored, honest analysis. Return your response ONLY as valid JSON — no markdown, no code blocks, no extra text. Just pure JSON.

Required JSON format:
{{
  "category_scores": {{
    "formatting": <integer between 0 and 20: formatting, spacing, margins, font style, and ATS parsing readiness>,
    "skills_match": <integer between 0 and 25: relevance of technical skills matching a {target_role} role>,
    "experience_quality": <integer between 0 and 20: job relevance, responsibilities, quantifiable achievements>,
    "projects_portfolio": <integer between 0 and 15: project scope, tech stack, and GitHub portfolio presence>,
    "education_certifications": <integer between 0 and 10: education relevance, certifications like AWS, Google, etc.>,
    "resume_structure": <integer between 0 and 10: structure, flow, sections clarity (Objective, Education, Experience, etc.)>
  }},
  "ats_score": <integer total sum of category_scores: must be exactly equal to formatting + skills_match + experience_quality + projects_portfolio + education_certifications + resume_structure (sum will be between 0 and 100)>,
  "missing_skills": ["<specific tech skill or library missing strictly for the target role {target_role}. Recommend ONLY role-relevant skills. Consider candidate experience level. Do not suggest high-level cloud/enterprise devops tools like Kubernetes unless context supports it.>"],
  "strengths": ["<detailed role-specific resume strength matching a {target_role} position>"],
  "weaknesses": ["<detailed weak section or missing element relative to a {target_role} candidate>"],
  "suggestions": ["<actionable improvement recommendation to make the resume better for a {target_role} application>"],
  "final_verdict": "<2-3 sentence overall recommendation summary: impression and advice for target role {target_role}>"
}}

Strict Rules:
1. Tailor all feedback, strengths, and missing skills strictly to the target role: **{target_role}**. Avoid generic suggestions.
2. The total 'ats_score' must be the exact sum of the six category scores.
3. Recommend only highly relevant skills for a **{target_role}** position.
4. Return ONLY valid JSON. No prefix, no suffix, no markdown formatting. Just pure JSON.

CRITICAL SCORING & MISMATCH PENALTY RULES (MUST BE STRICTLY ENFORCED):
- **Honest & Critical Evaluation**: Do NOT inflate scores to be nice or polite. Scores above 70 should be reserved for resumes that genuinely align well with the target role. A typical average resume should score between 40 and 65.
- **Complete Mismatch Penalty**: If the resume is for a completely different career field or industry (e.g. a chef, driver, or cashier applying for a **{target_role}** role), or if it contains gibberish/lorem ipsum, you MUST heavily penalize them:
  - `skills_match` MUST be scored between 0 and 3.
  - `experience_quality` MUST be scored between 0 and 3.
  - `projects_portfolio` MUST be scored between 0 and 3.
  - This should result in a total `ats_score` of 30 or lower.
  - In `strengths`, state clearly that there are no strengths matching the target role of **{target_role}**.
  - In `weaknesses` and `suggestions`, explain clearly that the resume is completely mismatched and the candidate needs to build a completely new resume tailored to the target role.
- **Thin Content Penalty**: If the resume contains very little information (less than 1-2 paragraphs of readable text), give extremely low scores across all categories, reflecting an incomplete profile.

RESUME CONTENT TO ANALYZE:
---
{resume_text}
---"""

    return prompt


def _clean_exception_message(error_str: str) -> str:
    """
    Extracts a clean, human-readable message from Google API errors.
    E.g. extracts "API key expired. Please renew the API key." from a raw string.
    """
    # Look for 'message': '...' or "message": "..."
    match = re.search(r'[\'"]message[\'"]:\s*[\'"]([^\'"]+)[\'"]', error_str)
    if match:
        return match.group(1)
    
    # Alternatively, look for a HTTP status code prefix
    # E.g. "400 INVALID_ARGUMENT." -> remove or simplify
    clean_str = re.sub(r'^\d+\s+[A-Z_]+\.?\s*', '', error_str)
    # Remove any raw JSON-like brackets
    clean_str = re.sub(r'\{.*\}', '', clean_str).strip()
    if clean_str:
        return clean_str
        
    return error_str


def analyze_resume_with_gemini(resume_text: str, target_role: str) -> dict:
    """
    Main function to analyze a resume. Uses gemini-2.5-flash.

    Args:
        resume_text : Cleaned text extracted from the PDF
        target_role : Job role the user is targeting

    Returns:
        A dictionary with the structured analysis result.
    """
    result = {
        'ats_score': 0,
        'category_scores': {},
        'missing_skills': [],
        'strengths': [],
        'weaknesses': [],
        'suggestions': [],
        'final_verdict': '',
        'full_ai_response': '',
        'error': None,
    }

    # Validate inputs
    if not resume_text or len(resume_text.strip()) < 50:
        result['error'] = (
            'Resume text is too short to analyze. '
            'Please ensure your PDF contains readable text.'
        )
        return result

    gemini_key = getattr(settings, 'GEMINI_API_KEY', '')
    masked_key = f"{gemini_key[:8]}...{gemini_key[-4:]}" if len(gemini_key) > 12 else "INVALID/EMPTY"
    print(f"[AIService] Calling Gemini API. Loaded key: {masked_key}")

    if not gemini_key:
        result['error'] = 'GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in your .env file.'
        return result

    model_name = 'gemini-2.5-flash'
    try:
        print(f"[AIService] Attempting analysis with Gemini model: {model_name}")
        prompt = build_analysis_prompt(resume_text, target_role)
        client = genai.Client(api_key=gemini_key)
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                response_mime_type="application/json",
                max_output_tokens=4096,
            ),
        )
        raw_response = response.text
        result['full_ai_response'] = raw_response
        
        # Parse
        parsed = _parse_gemini_response(raw_response)
        result.update(parsed)
        
        # Verify that it parsed successfully
        if result['ats_score'] > 0 and result['final_verdict'] != 'Analysis could not be parsed. Please try again.':
            print(f"[AIService] Successfully analyzed with Gemini model: {model_name}")
            return result
        else:
            raise ValueError(f"AI response parsing failed. Raw response: {raw_response[:500]}")
    except Exception as e:
        clean_err = _clean_exception_message(str(e))
        print(f"[AIService] Gemini {model_name} failed: {clean_err}")
        
        # Print diagnostic info for debugging
        print("----- DIAGNOSTIC INFO ON FAILURE -----")
        print(f"Extracted resume text length: {len(resume_text) if resume_text else 0}")
        print(f"Exact Gemini response: {result.get('full_ai_response')}")
        print("--------------------------------------")
        
        result['error'] = f"AI analysis failed: {clean_err}"
        return result


def _parse_gemini_response(raw_response: str) -> dict:
    """
    Parse Gemini's raw text response into structured data.
    """
    default = {
        'ats_score': 0,
        'category_scores': {},
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

        ats_score = _safe_int(data.get('ats_score', 0), 0, 100)
        category_scores = _clean_category_scores(data.get('category_scores', {}), ats_score)
        
        # Re-align total score to be the exact sum of category scores for consistency
        total_from_categories = sum(category_scores.values())
        if total_from_categories > 0:
            ats_score = total_from_categories

        return {
            'ats_score': ats_score,
            'category_scores': category_scores,
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


def _clean_category_scores(scores_dict, ats_score: int) -> dict:
    """Ensure category scores are valid and sum correctly. Compute fallbacks if missing."""
    if not isinstance(scores_dict, dict) or not scores_dict:
        # Distribute ats_score proportionally
        f = round(ats_score * 0.20)
        sm = round(ats_score * 0.25)
        eq = round(ats_score * 0.20)
        pp = round(ats_score * 0.15)
        ec = round(ats_score * 0.10)
        rs = ats_score - (f + sm + eq + pp + ec)
        return {
            'formatting': f,
            'skills_match': sm,
            'experience_quality': eq,
            'projects_portfolio': pp,
            'education_certifications': ec,
            'resume_structure': max(0, rs)
        }
    
    return {
        'formatting': _safe_int(scores_dict.get('formatting', 0), 0, 20),
        'skills_match': _safe_int(scores_dict.get('skills_match', 0), 0, 25),
        'experience_quality': _safe_int(scores_dict.get('experience_quality', 0), 0, 20),
        'projects_portfolio': _safe_int(scores_dict.get('projects_portfolio', 0), 0, 15),
        'education_certifications': _safe_int(scores_dict.get('education_certifications', 0), 0, 10),
        'resume_structure': _safe_int(scores_dict.get('resume_structure', 0), 0, 10)
    }


# Helper functions for clean parsed data removed.


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
