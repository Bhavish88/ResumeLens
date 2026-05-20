"""URL routes for the users (authentication) app."""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'users'

urlpatterns = [
    # Registration
    path('register/', views.RegisterView.as_view(), name='register'),

    # Login — returns access + refresh tokens
    path('login/', views.LoginView.as_view(), name='login'),

    # Logout — blacklists refresh token
    path('logout/', views.LogoutView.as_view(), name='logout'),

    # Current user profile
    path('me/', views.UserProfileView.as_view(), name='profile'),

    # Token refresh — use when access token expires
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
