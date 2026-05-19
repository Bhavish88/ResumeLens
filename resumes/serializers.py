"""
Serializers for the resumes app.

ResumeUploadSerializer  → validates incoming PDF upload + target_role
ResumeListSerializer    → safe representation for listing resumes
ResumeDetailSerializer  → full detail including extracted_text
"""

from rest_framework import serializers
from .models import Resume


class ResumeUploadSerializer(serializers.ModelSerializer):
    """
    Used for the POST /upload/ endpoint.
    Validates:
      - resume_file must be a PDF
      - resume_file must be under 10MB
      - target_role must be provided
    """

    resume_file = serializers.FileField()
    target_role = serializers.CharField(max_length=200)

    class Meta:
        model = Resume
        fields = ['resume_file', 'target_role']

    def validate_resume_file(self, value):
        # Check file extension
        name = value.name.lower()
        if not name.endswith('.pdf'):
            raise serializers.ValidationError('Only PDF files are accepted.')

        # Check file size (10 MB limit)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError('File size must be under 10 MB.')

        return value

    def validate_target_role(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError('Please enter a valid target role.')
        return value.strip()


class ResumeListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing a user's resumes.
    Does NOT include extracted_text (too large for list views).
    """

    has_analysis = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = ['id', 'file_name', 'target_role', 'uploaded_at', 'has_analysis']
        read_only_fields = fields

    def get_has_analysis(self, obj):
        """Returns True if an analysis report exists for this resume."""
        return hasattr(obj, 'analysis_report') and obj.analysis_report is not None


class ResumeDetailSerializer(serializers.ModelSerializer):
    """
    Full detail view of a resume, including extracted text.
    Used by the analysis endpoint to pass text to Gemini.
    """

    has_analysis = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = [
            'id', 'file_name', 'target_role',
            'extracted_text', 'uploaded_at', 'has_analysis'
        ]
        read_only_fields = fields

    def get_has_analysis(self, obj):
        return hasattr(obj, 'analysis_report') and obj.analysis_report is not None
