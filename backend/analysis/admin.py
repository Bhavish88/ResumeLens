from django.contrib import admin
from .models import AnalysisReport


@admin.register(AnalysisReport)
class AnalysisReportAdmin(admin.ModelAdmin):
    list_display = ['id', 'resume', 'ats_score', 'created_at']
    list_filter = ['ats_score', 'created_at']
    search_fields = ['resume__user__email', 'resume__target_role']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'full_ai_response']
