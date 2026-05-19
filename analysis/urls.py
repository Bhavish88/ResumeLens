"""URL routes for the analysis app."""

from django.urls import path
from . import views

app_name = 'analysis'

urlpatterns = [
    # Trigger AI analysis for a resume
    path('analyze/<int:resume_id>/', views.AnalyzeResumeView.as_view(), name='analyze'),

    # Get report by report ID
    path('<int:pk>/', views.AnalysisResultView.as_view(), name='result'),

    # Get report by resume ID (frontend convenience)
    path('resume/<int:resume_id>/', views.AnalysisResultByResumeView.as_view(), name='result_by_resume'),

    # All user's past reports
    path('history/', views.AnalysisHistoryView.as_view(), name='history'),

    # Dashboard stats
    path('dashboard/', views.DashboardStatsView.as_view(), name='dashboard'),

    # Delete a report
    path('<int:pk>/delete/', views.AnalysisDeleteView.as_view(), name='delete'),
]
