# backend/users/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.utils.crypto import get_random_string
from api.models import College

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        
        
        if 'username' not in extra_fields or not extra_fields['username']:
            # Generate username based on email prefix + random string
            username = email.split('@')[0] + get_random_string(length=8)
            extra_fields['username'] = username
        
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', _('Admin')
        HOD = 'HOD', _('Head of Department')
        LECTURER = 'LECTURER', _('Lecturer')
        STUDENT = 'STUDENT', _('Student')
    
    email = models.EmailField(_('email address'), unique=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.STUDENT,
    )

    college = models.ForeignKey(
        College, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="students"
    )
    
    # Add department field for HOD users
    department = models.ForeignKey(
        'api.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="hod"
    )

    is_verified = models.BooleanField(
        _('Verified'),
        default=False,
        help_text=_('Designates whether the user has verified their email.')
    )
    verification_token = models.CharField(
        max_length=32,
        null=True,
        blank=True,
        unique=True
    )
    verification_token_created_at = models.DateTimeField(
        null=True,
        blank=True
    )
    
    USERNAME_FIELD = 'email'  # Use email for authentication
    REQUIRED_FIELDS = []  # Email is already required
    
    objects = UserManager()

    def is_student(self):
        return self.role == self.Role.STUDENT
    
    def is_lecturer(self):
        return self.role == self.Role.LECTURER
    
    def is_hod(self):
        return self.role == self.Role.HOD
    
    def is_admin(self):
        return self.role == self.Role.ADMIN

    def __str__(self):
        return f"{self.email} - {self.get_role_display()}"