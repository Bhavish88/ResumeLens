"""
Root URL configuration for AI Resume Analyzer backend.
All app-level URLs are namespaced and prefixed with /api/
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # Authentication endpoints
    path('api/auth/', include('users.urls', namespace='users')),

    # Resume upload & management endpoints
    path('api/resumes/', include('resumes.urls', namespace='resumes')),

    # Analysis endpoints
    path('api/analysis/', include('analysis.urls', namespace='analysis')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
