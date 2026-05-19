from django.contrib import admin
from .models import Resume


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'file_name', 'target_role', 'uploaded_at']
    list_filter = ['target_role', 'uploaded_at']
    search_fields = ['user__email', 'user__name', 'file_name', 'target_role']
    ordering = ['-uploaded_at']
    readonly_fields = ['uploaded_at', 'extracted_text']
