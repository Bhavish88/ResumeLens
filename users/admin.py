from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'email', 'created_at', 'is_active', 'is_staff']
    list_filter = ['is_active', 'is_staff', 'created_at']
    search_fields = ['name', 'email']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
