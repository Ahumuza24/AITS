# backend/api/serializers.py
from rest_framework import serializers
from users.models import User
from .models import College, Department, Course, Issue, Notification
from users.serializers import UserSerializer

# Course related serializers
class CourseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField(max_length=255)

class StudentCourseSerializer(CourseSerializer):
    grade = serializers.CharField(max_length=10)

class LecturerCourseSerializer(CourseSerializer):
    students = serializers.IntegerField()

# Announcement serializer
class AnnouncementSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField(max_length=255)
    date = serializers.DateField()

# Deadline serializer
class DeadlineSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField(max_length=255)
    due_date = serializers.DateField()

# Class schedule serializer
class ClassScheduleSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    course = serializers.CharField(max_length=255)
    time = serializers.CharField(max_length=255)

# Grading item serializer
class PendingGradingSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField(max_length=255)
    submissions = serializers.IntegerField()
    course = serializers.CharField(max_length=255)

# Activity serializer
class ActivitySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    type = serializers.CharField(max_length=255)
    details = serializers.CharField(max_length=255)
    date = serializers.DateField()

# Dashboard serializers
class StudentDashboardSerializer(serializers.Serializer):
    courses = StudentCourseSerializer(many=True)
    announcements = AnnouncementSerializer(many=True)
    upcoming_deadlines = DeadlineSerializer(many=True)

class LecturerDashboardSerializer(serializers.Serializer):
    courses = LecturerCourseSerializer(many=True)
    upcoming_classes = ClassScheduleSerializer(many=True)
    pending_grading = PendingGradingSerializer(many=True)

class UserStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    students = serializers.IntegerField()
    lecturers = serializers.IntegerField()
    admins = serializers.IntegerField()

class CourseStatsSerializer(serializers.Serializer):
    active = serializers.IntegerField()
    archived = serializers.IntegerField()

class SystemHealthSerializer(serializers.Serializer):
    status = serializers.CharField()
    uptime = serializers.CharField()
    recent_issues = serializers.ListField(child=serializers.CharField(), required=False)

class AdminDashboardSerializer(serializers.Serializer):
    users = UserStatsSerializer()
    courses = CourseStatsSerializer()
    system_health = SystemHealthSerializer()
    recent_activities = ActivitySerializer(many=True)

class CollegeSerializer(serializers.ModelSerializer):
    class Meta:
        model = College
        fields = ['id', 'name', 'code', 'description', 'created_at', 'updated_at']

class DepartmentSerializer(serializers.ModelSerializer):
    college = CollegeSerializer(read_only=True)
    college_name = serializers.SerializerMethodField()
    college_id = serializers.PrimaryKeyRelatedField(
        source='college',
        queryset=College.objects.all(),
        write_only=True
    )
    
    class Meta:
        model = Department
        fields = ['id', 'department_name', 'department_code', 'details', 'college', 'college_name', 'college_id']
        read_only_fields = ['id']
    
    def get_college_name(self, obj):
        return obj.college.name if obj.college else None

class CourseSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.department_name", read_only=True)  # Get department name
    department_code = serializers.CharField(source="department.department_code", read_only=True)  # Get department code

    class Meta:
        model = Course  # Correct the model
        fields = ['id', 'course_code', 'course_name', 'details', 'department', 'department_name', 'department_code', 'created_at', 'updated_at']

class IssueSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    course = CourseSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    
    class Meta:
        model = Issue
        fields = [
            'id', 'title', 'student', 'course', 'issue_type', 
            'description', 'status', 'created_at', 'updated_at', 'assigned_to'
        ]
        read_only_fields = ['student', 'created_at', 'updated_at']

class IssueCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Issue
        fields = ['course', 'issue_type', 'description', 'title']
    
    def create(self, validated_data):
        # Get the current user from the context
        user = self.context['request'].user
        
        # Add student and status to the validated data
        validated_data['student'] = user
        validated_data['status'] = 'Pending'
        
        # Create and return the issue
        return Issue.objects.create(**validated_data)

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'issue', 'message', 'notification_type', 'created_at', 'read']
        read_only_fields = ['created_at']
