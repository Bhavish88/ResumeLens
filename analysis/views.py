"""
Views for the analysis app.

AnalyzeResumeView       POST /api/analysis/analyze/<resume_id>/  — trigger AI analysis
AnalysisResultView      GET  /api/analysis/<report_id>/          — get a specific report
AnalysisHistoryView     GET  /api/analysis/history/              — all user's past reports
AnalysisDeleteView      DELETE /api/analysis/<report_id>/delete/ — delete a report
DashboardStatsView      GET  /api/analysis/dashboard/            — summary stats for dashboard
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from resumes.models import Resume
from .models import AnalysisReport
from .serializers import AnalysisReportSerializer, AnalysisSummarySerializer
from .gemini_service import analyze_resume_with_gemini


class AnalyzeResumeView(APIView):
    """
    POST /api/analysis/analyze/<resume_id>/

    Triggers Gemini AI analysis for the given resume.
    - If a report already exists, it will be OVERWRITTEN (re-analysis).
    - Returns the full structured analysis report.

    This is the most important endpoint in the project.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, resume_id):
        # Step 1: Get the resume (must belong to this user)
        try:
            resume = Resume.objects.get(pk=resume_id, user=request.user)
        except Resume.DoesNotExist:
            return Response(
                {'message': 'Resume not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Step 2: Check that text was extracted
        if not resume.extracted_text or len(resume.extracted_text.strip()) < 50:
            return Response({
                'message': 'This resume has no extractable text. '
                           'Please re-upload the PDF with selectable text.',
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        # Step 3: Call Gemini AI
        ai_result = analyze_resume_with_gemini(
            resume_text=resume.extracted_text,
            target_role=resume.target_role,
        )

        # Step 4: Handle AI errors
        if ai_result.get('error'):
            return Response({
                'message': 'AI analysis failed.',
                'error': ai_result['error'],
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # Step 5: Save or update the analysis report
        report, created = AnalysisReport.objects.update_or_create(
            resume=resume,
            defaults={
                'ats_score': ai_result['ats_score'],
                'missing_skills': ai_result['missing_skills'],
                'strengths': ai_result['strengths'],
                'weaknesses': ai_result['weaknesses'],
                'suggestions': ai_result['suggestions'],
                'final_verdict': ai_result['final_verdict'],
                'full_ai_response': ai_result['full_ai_response'],
            }
        )

        action = 'created' if created else 'updated'

        return Response({
            'message': f'Analysis {action} successfully.',
            'report': AnalysisReportSerializer(report).data,
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class AnalysisResultView(APIView):
    """
    GET /api/analysis/<report_id>/
    Returns full analysis report for a given report ID.
    Only the owner can view their report.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            report = AnalysisReport.objects.select_related(
                'resume', 'resume__user'
            ).get(pk=pk, resume__user=request.user)
        except AnalysisReport.DoesNotExist:
            return Response(
                {'message': 'Analysis report not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = AnalysisReportSerializer(report)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AnalysisResultByResumeView(APIView):
    """
    GET /api/analysis/resume/<resume_id>/
    Returns the analysis report for a given resume ID.
    Convenient endpoint — frontend can call this after upload.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, resume_id):
        try:
            resume = Resume.objects.get(pk=resume_id, user=request.user)
        except Resume.DoesNotExist:
            return Response(
                {'message': 'Resume not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            report = resume.analysis_report
        except AnalysisReport.DoesNotExist:
            return Response(
                {'message': 'No analysis found for this resume. Please run analysis first.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = AnalysisReportSerializer(report)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AnalysisHistoryView(APIView):
    """
    GET /api/analysis/history/
    Returns all analysis reports for the authenticated user,
    ordered by most recent first. Used for the dashboard history section.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reports = AnalysisReport.objects.filter(
            resume__user=request.user
        ).select_related('resume').order_by('-created_at')

        serializer = AnalysisSummarySerializer(reports, many=True)

        return Response({
            'count': reports.count(),
            'reports': serializer.data,
        }, status=status.HTTP_200_OK)


class AnalysisDeleteView(APIView):
    """
    DELETE /api/analysis/<report_id>/delete/
    Deletes an analysis report. The resume itself is preserved.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            report = AnalysisReport.objects.get(
                pk=pk, resume__user=request.user
            )
        except AnalysisReport.DoesNotExist:
            return Response(
                {'message': 'Analysis report not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        report.delete()
        return Response(
            {'message': 'Analysis report deleted.'},
            status=status.HTTP_200_OK
        )


class DashboardStatsView(APIView):
    """
    GET /api/analysis/dashboard/

    Returns aggregated stats for the authenticated user's dashboard:
      - total resumes uploaded
      - total analyses run
      - average ATS score
      - best ATS score
      - recent 5 analyses (summary)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Avg, Max, Count

        user = request.user
        resumes = Resume.objects.filter(user=user)
        reports = AnalysisReport.objects.filter(resume__user=user)

        stats = reports.aggregate(
            average_score=Avg('ats_score'),
            best_score=Max('ats_score'),
            total_analyses=Count('id'),
        )

        recent_reports = AnalysisSummarySerializer(
            reports.order_by('-created_at')[:5],
            many=True
        ).data

        return Response({
            'total_resumes': resumes.count(),
            'total_analyses': stats['total_analyses'] or 0,
            'average_ats_score': round(stats['average_score'] or 0, 1),
            'best_ats_score': stats['best_score'] or 0,
            'recent_analyses': recent_reports,
        }, status=status.HTTP_200_OK)
