"""
Resume model — stores uploaded PDFs and their extracted text.

TABLE: resumes
  id             — auto PK
  user           — FK to users.User
  resume_file    — the actual PDF file stored in media/resumes/
  extracted_text — raw text pulled from the PDF via pdfplumber
  target_role    — job role the user is targeting (e.g. "Python Developer")
  file_name      — original filename of the uploaded PDF
  uploaded_at    — timestamp
"""

from django.db import models
from django.conf import settings


def resume_upload_path(instance, filename):
    """Store resumes in: media/resumes/<user_id>/<filename>"""
    return f'resumes/{instance.user.id}/{filename}'


class Resume(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='resumes',
    )
    resume_file = models.FileField(upload_to=resume_upload_path)
    extracted_text = models.TextField(blank=True, default='')
    target_role = models.CharField(max_length=200)
    file_name = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'resumes'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f'Resume of {self.user.name} — {self.target_role} ({self.uploaded_at.date()})'
