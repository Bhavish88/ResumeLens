"""
Serializers for the analysis app.

AnalysisReportSerializer → full serialization of an analysis report
AnalysisSummarySerializer → lightweight version for dashboard listing
"""

from rest_framework import serializers
from .models import AnalysisReport


class AnalysisReportSerializer(serializers.ModelSerializer):
    """
    Full analysis report — used for the result page.
    Includes resume metadata from the related resume object.
    """

    resume_id = serializers.IntegerField(source='resume.id', read_only=True)
    target_role = serializers.CharField(source='resume.target_role', read_only=True)
    file_name = serializers.CharField(source='resume.file_name', read_only=True)
    uploaded_at = serializers.DateTimeField(source='resume.uploaded_at', read_only=True)

    class Meta:
        model = AnalysisReport
        fields = [
            'id',
            'resume_id',
            'target_role',
            'file_name',
            'uploaded_at',
            'ats_score',
            'category_scores',
            'missing_skills',
            'strengths',
            'weaknesses',
            'suggestions',
            'final_verdict',
            'created_at',
        ]
        read_only_fields = fields


class AnalysisSummarySerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for dashboard/history listing.
    Does NOT include the large skill/suggestion arrays.
    """

    resume_id = serializers.IntegerField(source='resume.id', read_only=True)
    target_role = serializers.CharField(source='resume.target_role', read_only=True)
    file_name = serializers.CharField(source='resume.file_name', read_only=True)

    class Meta:
        model = AnalysisReport
        fields = [
            'id',
            'resume_id',
            'target_role',
            'file_name',
            'ats_score',
            'final_verdict',
            'created_at',
        ]
        read_only_fields = fields
