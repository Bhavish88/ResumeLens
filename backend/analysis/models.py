"""
AnalysisReport model — stores the structured AI analysis result.

TABLE: analysis_reports
  id               — auto PK
  resume           — OneToOne FK to resumes.Resume
  ats_score        — integer 1-100
  missing_skills   — JSON array of missing skill strings
  strengths        — JSON array of strength strings
  weaknesses       — JSON array of weak section strings
  suggestions      — JSON array of improvement suggestion strings
  final_verdict    — short summary verdict from Gemini
  full_ai_response — raw Gemini text response (for debugging/audit)
  created_at       — timestamp

Design decision:
  OneToOne → each resume can only have ONE analysis report.
  This keeps the data model clean. If the user wants to re-analyze,
  the old report is overwritten.
"""

from django.db import models


class AnalysisReport(models.Model):
    resume = models.OneToOneField(
        'resumes.Resume',
        on_delete=models.CASCADE,
        related_name='analysis_report',
    )

    ats_score = models.IntegerField(default=0)

    # JSON arrays stored as TextField with JSONField fallback
    missing_skills = models.JSONField(default=list)
    strengths = models.JSONField(default=list)
    weaknesses = models.JSONField(default=list)
    suggestions = models.JSONField(default=list)
    category_scores = models.JSONField(default=dict)

    final_verdict = models.TextField(blank=True, default='')
    full_ai_response = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'analysis_reports'
        ordering = ['-created_at']

    def __str__(self):
        return f'Analysis for Resume #{self.resume_id} — ATS Score: {self.ats_score}'
