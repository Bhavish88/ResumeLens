"""
Views for the users app.

RegisterView        POST /api/auth/register/
LoginView           POST /api/auth/login/
LogoutView          POST /api/auth/logout/
UserProfileView     GET  /api/auth/me/
TokenRefreshView    POST /api/auth/token/refresh/  (from simplejwt)
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from .serializers import RegisterSerializer, LoginSerializer, UserProfileSerializer


class RegisterView(APIView):
    """
    POST /api/auth/register/
    Creates a new user account.
    No authentication required.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            # Auto-generate tokens on registration
            refresh = RefreshToken.for_user(user)

            return Response({
                'message': 'Account created successfully.',
                'user': UserProfileSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            }, status=status.HTTP_201_CREATED)

        return Response({
            'message': 'Registration failed.',
            'errors': serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    POST /api/auth/login/
    Authenticates user and returns JWT tokens.
    No authentication required.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data['user']

            return Response({
                'message': 'Login successful.',
                'user': UserProfileSerializer(user).data,
                'tokens': {
                    'access': serializer.validated_data['access'],
                    'refresh': serializer.validated_data['refresh'],
                }
            }, status=status.HTTP_200_OK)

        return Response({
            'message': 'Login failed.',
            'errors': serializer.errors,
        }, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Blacklists the refresh token so it can no longer be used.
    Requires authentication.

    Body: { "refresh": "<refresh_token>" }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'message': 'Refresh token is required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response(
                {'message': 'Logged out successfully.'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'message': 'Invalid token or already logged out.', 'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class UserProfileView(APIView):
    """
    GET  /api/auth/me/       → returns current user's profile
    PUT  /api/auth/me/       → updates name (email cannot be changed)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        user = request.user
        name = request.data.get('name', '').strip()

        if not name:
            return Response(
                {'message': 'Name cannot be empty.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.name = name
        user.save()

        return Response({
            'message': 'Profile updated.',
            'user': UserProfileSerializer(user).data,
        }, status=status.HTTP_200_OK)
