"""
Serializers for the users app.

RegisterSerializer  → validates and creates new users
LoginSerializer     → authenticates and returns JWT tokens
UserProfileSerializer → safe read of user data (no password)
"""

from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    """
    Handles new user registration.
    - password is write-only (never returned in responses)
    - password2 is used for confirmation — not stored
    """

    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'password', 'password2']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return data

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

    def create(self, validated_data):
        # Remove password2 before creating user
        validated_data.pop('password2')
        user = User.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'],
            password=validated_data['password'],
        )
        return user


class LoginSerializer(serializers.Serializer):
    """
    Validates email + password credentials.
    On success, generates and returns JWT access + refresh tokens.
    """

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        user = authenticate(username=email, password=password)

        if not user:
            raise serializers.ValidationError('Invalid email or password. Please try again.')

        if not user.is_active:
            raise serializers.ValidationError('Your account has been deactivated.')

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return {
            'user': user,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Safe, read-only representation of the user.
    Used for the /me/ endpoint and embedded in other responses.
    """

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'created_at']
        read_only_fields = fields
