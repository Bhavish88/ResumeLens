"""
Custom User model for AI Resume Analyzer.
Extends AbstractBaseUser so we use email as the login field,
not Django's default username.
"""

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class UserManager(BaseUserManager):
    """Custom manager that uses email instead of username."""

    def create_user(self, email, name, password=None):
        if not email:
            raise ValueError('An email address is required.')
        email = self.normalize_email(email)
        user = self.model(email=email, name=name)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None):
        user = self.create_user(email, name, password)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model.

    Fields:
      - id         : auto-generated primary key
      - name       : full display name
      - email      : unique login identifier
      - password   : hashed by Django automatically
      - created_at : timestamp of account creation
      - is_active  : account enabled flag
      - is_staff   : admin panel access flag
    """

    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} <{self.email}>'
