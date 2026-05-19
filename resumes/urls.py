"""URL routes for the resumes app."""

from django.urls import path
from . import views

app_name = 'resumes'

urlpatterns = [
    # Upload a new resume
    path('upload/', views.ResumeUploadView.as_view(), name='upload'),

    # List all user's resumes
    path('', views.ResumeListView.as_view(), name='list'),

    # Detail of a single resume
    path('<int:pk>/', views.ResumeDetailView.as_view(), name='detail'),

    # Delete a resume
    path('<int:pk>/delete/', views.ResumeDeleteView.as_view(), name='delete'),
]
