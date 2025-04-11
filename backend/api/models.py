# backend/api/models.py
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings

class College(models.Model):
    name = models.CharField(
        _("College Name"),
        max_length=100,
        unique=True,
        help_text="Official name of the college"
    )
    code = models.CharField(
        _("College Code"),
        max_length=10,
        unique=True,
        help_text="Short unique code for the college (e.g., SCI for Science)"
    )
    description = models.TextField(
        _("Description"),
        blank=True,
        null=True,
        help_text="Detailed description of the college"
    )
    
    created_at = models.DateTimeField(
        _("Created At"),
        auto_now_add=True,
        help_text="Timestamp of creation"
    )
    updated_at = models.DateTimeField(
        _("Updated At"),
        auto_now=True,
        help_text="Timestamp of last update"
    )

    class Meta:
        verbose_name = _("College")
        verbose_name_plural = _("Colleges")
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(
                fields=['name', 'code'],
                name='unique_college_identifier'
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"
    
class Department(models.Model):
    department_name = models.CharField(
        _("Department Name"),
        max_length=100,
        unique=True,
        help_text="Official name of the department"
    )
    department_code = models.CharField(
        _("Department Code"),
        max_length=10,
        unique=True,
        help_text="Short unique code for the department (e.g., DCS for Computer Science)"
    )
    details = models.TextField(
        _("Details"),
        blank=True,
        null=True,
        help_text="Detailed description of the department"
    )
    college = models.ForeignKey(College, on_delete=models.CASCADE)
    created_at = models.DateTimeField(
        _("Created At"),
        auto_now_add=True,
        help_text="Timestamp of creation"
    )
    updated_at = models.DateTimeField(
        _("Updated At"),
        auto_now=True,
        help_text="Timestamp of last update"
    )

    class Meta:
        verbose_name = _("Department")
        verbose_name_plural = _("Departments")
        ordering = ['department_name']
        constraints = [
            models.UniqueConstraint(
                fields=['department_name'],
                name='unique_department_identifier'
            )
        ]

    def __str__(self):
        return f"{self.department_name}"
    
class Course(models.Model):
    course_name = models.CharField(
        _("Course Name"),
        max_length=100,
        unique=True,
        help_text="Official name of the course"
    )
    course_code = models.CharField(
        _("Course Code"),
        max_length=10,
        unique=True,
        help_text="Short unique code for the course (e.g., CS101 for Introduction to Computer Science)"
    )
    details = models.TextField(
        _("Details"),
        blank=True,
        null=True,
        help_text="Detailed description of the course"
    )
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    created_at = models.DateTimeField(
        _("Created At"),
        auto_now_add=True,
        help_text="Timestamp of creation"
    )
    updated_at = models.DateTimeField(
        _("Updated At"),
        auto_now=True,
        help_text="Timestamp of last update"
    )

    class Meta:
        verbose_name = _("Course")
        verbose_name_plural = _("Courses")
        ordering = ['course_name']
        constraints = [
            models.UniqueConstraint(
                fields=['course_name', 'course_code'],
                name='unique_course_identifier'
            )
        ]
    def __str__(self):
        return f"{self.course_name} ({self.course_code})"
    
class Issue(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('InProgress', 'In Progress'),
        ('Solved', 'Solved'),
    ]
    
    ISSUE_TYPE_CHOICES = [
        ('Missing Marks', 'Missing Marks'),
        ('Appeals', 'Appeals'),
        ('Corrections', 'Corrections'),
    ]
    
    id = models.AutoField(primary_key=True)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='issues')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='issues')
    issue_type = models.CharField(max_length=50, choices=ISSUE_TYPE_CHOICES)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    title = models.CharField(max_length=200)  # Added to match your React component
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='assigned_issues'
    )
    
    def __str__(self):
        return f"{self.id} - {self.title} ({self.status})"
    
    class Meta:
        ordering = ['-created_at']

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('ISSUE_CREATED', 'Issue Created'),
        ('ISSUE_ASSIGNED', 'Issue Assigned'),
        ('STATUS_CHANGED', 'Status Changed'),
        ('NEW_ISSUE', 'New Issue'),
        ('STATUS_UPDATE', 'Status Update'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    message = models.CharField(max_length=255)
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.notification_type} - {self.user.email} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
    
    class Meta:
        ordering = ['-created_at']
