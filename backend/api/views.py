# backend/api/views.py
from rest_framework import status, permissions, viewsets
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import College, Department, Course, Issue, Notification
from .serializers import CollegeSerializer, DepartmentSerializer, CourseSerializer, IssueSerializer, IssueCreateSerializer, NotificationSerializer
from rest_framework.permissions import IsAdminUser, AllowAny
from rest_framework.decorators import action
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Count
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver

class CollegeListView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        colleges = College.objects.all()
        serializer = CollegeSerializer(colleges, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CollegeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request):
        # Extra check - only admins can modify colleges
        if not (request.user.is_staff or request.user.role == 'ADMIN'):
            return Response({"detail": "Only admin users can modify colleges."}, 
                            status=status.HTTP_403_FORBIDDEN)
            
        college = get_object_or_404(College, pk=request.data.get('id'))
        serializer = CollegeSerializer(college, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request):
        # Extra check - only admins can delete colleges
        if not (request.user.is_staff or request.user.role == 'ADMIN'):
            return Response({"detail": "Only admin users can delete colleges."}, 
                           status=status.HTTP_403_FORBIDDEN)
            
        college = get_object_or_404(College, pk=request.data.get('id'))
        college.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class CollegeDetailView(APIView):
    permission_classes = [IsAdminUser]
    
    def get_object(self, pk):
        try:
            return College.objects.get(pk=pk)
        except College.DoesNotExist:
            return None
    
    def get(self, request, pk):
        college = self.get_object(pk)
        if not college:
            return Response({"detail": "College not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = CollegeSerializer(college)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request, pk):
        college = self.get_object(pk)
        if not college:
            return Response({"detail": "College not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = CollegeSerializer(college, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        college = self.get_object(pk)
        if not college:
            return Response({"detail": "College not found"}, status=status.HTTP_404_NOT_FOUND)
        college.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class CollegeCreateView(APIView):
    # authentication_classes = [JWTAuthentication]  # If using JWT
    permission_classes = [IsAdminUser]  # Requires admin user
    
    def post(self, request):
        serializer = CollegeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class DepartmentListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        departments = Department.objects.all()
        serializer = DepartmentSerializer(departments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = DepartmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class IsAdminOrHOD(permissions.BasePermission):
    """
    Custom permission to allow department access to admins and HODs.
    """
    def has_permission(self, request, view):
        # Staff can access anything
        if request.user.is_staff or request.user.role == 'ADMIN':
            return True
        
        # HODs can access their own department
        if request.user.role == 'HOD' and hasattr(request.user, 'department'):
            # For detail views, we need to check the pk against the user's department
            if 'pk' in view.kwargs:
                return str(request.user.department.id) == str(view.kwargs['pk'])
            return True
        
        return False

class DepartmentDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHOD]
    
    def get_object(self, pk):
        try:
            return Department.objects.get(pk=pk)
        except Department.DoesNotExist:
            return None
    
    def get(self, request, pk):
        department = self.get_object(pk)
        if not department:
            return Response({"detail": "Department not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = DepartmentSerializer(department)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request, pk):
        # Extra check - only admins can edit
        if not (request.user.is_staff or request.user.role == 'ADMIN'):
            return Response({"detail": "Only admin users can modify departments."}, 
                            status=status.HTTP_403_FORBIDDEN)
            
        department = self.get_object(pk)
        if not department:
            return Response({"detail": "Department not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = DepartmentSerializer(department, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        # Extra check - only admins can delete
        if not (request.user.is_staff or request.user.role == 'ADMIN'):
            return Response({"detail": "Only admin users can delete departments."}, 
                           status=status.HTTP_403_FORBIDDEN)
            
        department = self.get_object(pk)
        if not department:
            return Response({"detail": "Department not found"}, status=status.HTTP_404_NOT_FOUND)
        department.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class DepartmentCreateView(APIView):
    permission_classes = [IsAdminUser]  # Requires admin user
    
    def post(self, request):
        serializer = DepartmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    
class CourseListView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        courses = Course.objects.all()
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request):
        serializer = CourseSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        # Extra check - only admins can modify courses
        if not (request.user.is_staff or request.user.role == 'ADMIN'):
            return Response({"detail": "Only admin users can modify courses."}, 
                            status=status.HTTP_403_FORBIDDEN)
            
        course = get_object_or_404(Course, pk=request.data.get('id'))
        serializer = CourseSerializer(course, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request):
        # Extra check - only admins can delete courses
        if not (request.user.is_staff or request.user.role == 'ADMIN'):
            return Response({"detail": "Only admin users can delete courses."}, 
                           status=status.HTTP_403_FORBIDDEN)
            
        course = get_object_or_404(Course, pk=request.data.get('id'))
        course.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class IsAdminOrHODForCourse(permissions.BasePermission):
    """
    Custom permission to allow course access to admins and HODs.
    """
    def has_permission(self, request, view):
        # Staff can access anything
        if request.user.is_staff or request.user.role == 'ADMIN':
            return True
        
        # HODs can access courses in their department
        if request.user.role == 'HOD' and hasattr(request.user, 'department') and request.user.department:
            # For detail views, we need to check the course's department against the user's department
            if 'pk' in view.kwargs:
                try:
                    course = Course.objects.get(pk=view.kwargs['pk'])
                    return str(request.user.department.id) == str(course.department.id)
                except Course.DoesNotExist:
                    return False
            return True
        
        return False

class CourseDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHODForCourse]
    
    def get_object(self, pk):
        try:
            return Course.objects.get(pk=pk)
        except Course.DoesNotExist:
            return None
    
    def get(self, request, pk):
        course = self.get_object(pk)
        if not course:
            return Response({"detail": "Course not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = CourseSerializer(course)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request, pk):
        # Extra check - only admins can edit
        if not (request.user.is_staff or request.user.role == 'ADMIN'):
            return Response({"detail": "Only admin users can modify courses."}, 
                            status=status.HTTP_403_FORBIDDEN)
            
        course = self.get_object(pk)
        if not course:
            return Response({"detail": "Course not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = CourseSerializer(course, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        # Extra check - only admins can delete
        if not (request.user.is_staff or request.user.role == 'ADMIN'):
            return Response({"detail": "Only admin users can delete courses."}, 
                           status=status.HTTP_403_FORBIDDEN)
            
        course = self.get_object(pk)
        if not course:
            return Response({"detail": "Course not found"}, status=status.HTTP_404_NOT_FOUND)
        course.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class CourseCreateView(APIView):
    permission_classes = [IsAdminUser]  # Requires admin user
    
    def post(self, request):
        serializer = CourseSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class IsOwnerOrStaff(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or staff to access it.
    """
    def has_object_permission(self, request, view, obj):
        # Staff can access any object
        if request.user.is_staff:
            return True
        
        # Check if the object has a student attribute and it matches the request user
        return hasattr(obj, 'student') and obj.student == request.user

class IssueCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = IssueCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class IssueViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing issues.
    """
    serializer_class = IssueSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaff]
    
    def get_queryset(self):
        """
        This view should return:
        - All issues for admin users
        - Own issues for students 
        - Assigned issues for lecturers and HODs
        """
        user = self.request.user
        
        # Admin can see all issues
        if user.is_staff or user.role == 'ADMIN':
            return Issue.objects.all()
        
        # Lecturers and HODs can see issues assigned to them
        if user.role in ['LECTURER', 'HOD']:
            return Issue.objects.filter(assigned_to=user)
        
        # Students can see only their own issues
        return Issue.objects.filter(student=user)
    
    def get_serializer_class(self):
        """
        Use different serializers for creation vs retrieval.
        """
        if self.action == 'create':
            return IssueCreateSerializer
        return IssueSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Return the complete issue object using the standard serializer
        issue = serializer.instance
        response_serializer = IssueSerializer(issue)
        
        # Create notification for admin users
        admin_users = User.objects.filter(is_staff=True) | User.objects.filter(role='ADMIN')
        for admin in admin_users:
            Notification.objects.create(
                user=admin,
                issue=issue,
                message=f"New issue created: {issue.title}",
                notification_type='ISSUE_CREATED'
            )
        
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """
        Endpoint to update just the status of an issue.
        - Admins can update any issue
        - Staff users can update any issue
        - Lecturers and HODs can update issues assigned to them
        """
        issue = self.get_object()
        old_status = issue.status
        new_status = request.data.get('status')
        
        # Check permissions - allow lecturers/HODs to update status of issues assigned to them
        user = request.user
        if not (user.is_staff or user.role == 'ADMIN'):
            # For non-admin users, verify they're assigned to this issue
            if user.role in ['LECTURER', 'HOD'] and issue.assigned_to and issue.assigned_to.id == user.id:
                # Assigned lecturer/HOD can update
                pass
            else:
                return Response(
                    {"detail": "You do not have permission to perform this action."},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        if new_status not in dict(Issue.STATUS_CHOICES):
            return Response(
                {"detail": f"Invalid status. Must be one of {dict(Issue.STATUS_CHOICES).keys()}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        issue.status = new_status
        issue.save()
        
        # Create notification for student when status changes
        if old_status != new_status:
            # Create notification for student
            Notification.objects.create(
                user=issue.student,
                issue=issue,
                message=f"Your issue '{issue.title}' status changed to {new_status}",
                notification_type='STATUS_CHANGED'
            )
            
            # Create notification for assigned staff if exists
            if issue.assigned_to and issue.assigned_to != user:
                Notification.objects.create(
                    user=issue.assigned_to,
                    issue=issue,
                    message=f"Issue '{issue.title}' status changed to {new_status}",
                    notification_type='STATUS_CHANGED'
                )
        
        serializer = self.get_serializer(issue)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """
        Assign an issue to a specific user (lecturer or HOD).
        Only admins can assign issues.
        """
        # Check if user has admin permissions
        if not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        issue = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {"detail": "User ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get the user to assign the issue to
            from users.models import User
            assigned_user = User.objects.get(id=user_id)
            
            # Check if the user is a lecturer or HOD
            if assigned_user.role not in ['LECTURER', 'HOD']:
                return Response(
                    {"detail": "Issues can only be assigned to lecturers or heads of department"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Assign the issue
            issue.assigned_to = assigned_user
            issue.status = 'InProgress'  # Update status to in progress
            issue.save()
            
            # Create notification for the assigned staff
            Notification.objects.create(
                user=assigned_user,
                issue=issue,
                message=f"Issue '{issue.title}' has been assigned to you",
                notification_type='ISSUE_ASSIGNED'
            )
            
            # Notify student that their issue has been assigned
            Notification.objects.create(
                user=issue.student,
                issue=issue,
                message=f"Your issue '{issue.title}' has been assigned to {assigned_user.first_name} {assigned_user.last_name}",
                notification_type='ISSUE_ASSIGNED'
            )
            
            serializer = self.get_serializer(issue)
            return Response(serializer.data)
            
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_staff_issues(request, user_id):
    try:
        # Check if the requesting user is the same as the user_id, an admin, or an HOD
        is_admin = request.user.is_staff
        is_self = str(request.user.id) == str(user_id)
        is_hod_of_same_dept = (
            hasattr(request.user, 'role') and 
            request.user.role == 'HOD' and 
            hasattr(request.user, 'department') and 
            request.user.department
        )
        
        if not (is_admin or is_self or is_hod_of_same_dept):
            return Response(
                {"detail": "You do not have permission to access this user's issues."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get the staff user
        from users.models import User
        staff_user = User.objects.get(pk=user_id)
        
        # Get issues assigned to this staff member
        staff_issues = Issue.objects.filter(assigned_to=staff_user)
        
        # If an HOD is requesting, ensure they can only see issues from their department
        if is_hod_of_same_dept and not is_admin:
            # Get courses in HOD's department
            dept_courses = Course.objects.filter(department=request.user.department)
            # Filter issues to only include those for courses in the HOD's department
            staff_issues = staff_issues.filter(course__in=dept_courses)
        
        serializer = IssueSerializer(staff_issues, many=True)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response(
            {"detail": "User not found."},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class StudentDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if not request.user.is_student():
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        
        # Get student's issues
        issues = Issue.objects.filter(student=request.user)
        
        # Get courses student has issues in
        course_ids = issues.values_list('course', flat=True).distinct()
        courses = Course.objects.filter(id__in=course_ids)
        
        # Calculate issue stats
        pending_issues = issues.filter(status='Pending').count()
        in_progress_issues = issues.filter(status='InProgress').count()
        solved_issues = issues.filter(status='Solved').count()
        
        # Format data
        data = {
            "user": {
                "id": request.user.id,
                "email": request.user.email,
                "first_name": request.user.first_name,
                "last_name": request.user.last_name,
                "role": request.user.role
            },
            "courses": [
                {
                    "id": course.id,
                    "course_name": course.course_name,
                    "course_code": course.course_code,
                    "department": {
                        "id": course.department.id,
                        "department_name": course.department.department_name
                    } if course.department else None
                } for course in courses
            ],
            "issues": [
                {
                    "id": issue.id,
                    "title": issue.title,
                    "issue_type": issue.issue_type,
                    "status": issue.status,
                    "created_at": issue.created_at,
                    "course": {
                        "id": issue.course.id,
                        "course_name": issue.course.course_name,
                        "course_code": issue.course.course_code
                    }
                } for issue in issues
            ],
            "issue_statistics": {
                "total": issues.count(),
                "pending": pending_issues,
                "in_progress": in_progress_issues,
                "solved": solved_issues
            }
        }
        return Response(data)

class LecturerDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if not request.user.is_lecturer() and not request.user.is_hod():
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        
        # Get issues assigned to the lecturer
        assigned_issues = Issue.objects.filter(assigned_to=request.user)
        
        # Get courses for which issues are assigned
        course_ids = assigned_issues.values_list('course', flat=True).distinct()
        courses = Course.objects.filter(id__in=course_ids)
        
        # Calculate issue stats
        pending_issues = assigned_issues.filter(status='Pending').count()
        in_progress_issues = assigned_issues.filter(status='InProgress').count()
        solved_issues = assigned_issues.filter(status='Solved').count()
        
        # Format data
        data = {
            "user": {
                "id": request.user.id,
                "email": request.user.email,
                "first_name": request.user.first_name,
                "last_name": request.user.last_name,
                "role": request.user.role
            },
            "assigned_issues": [
                {
                    "id": issue.id,
                    "title": issue.title,
                    "issue_type": issue.issue_type,
                    "status": issue.status,
                    "created_at": issue.created_at,
                    "course": {
                        "id": issue.course.id,
                        "course_name": issue.course.course_name,
                        "course_code": issue.course.course_code
                    },
                    "student": {
                        "id": issue.student.id,
                        "email": issue.student.email,
                        "first_name": issue.student.first_name,
                        "last_name": issue.student.last_name
                    }
                } for issue in assigned_issues
            ],
            "courses": [
                {
                    "id": course.id,
                    "course_name": course.course_name,
                    "course_code": course.course_code,
                    "department": {
                        "id": course.department.id,
                        "department_name": course.department.department_name
                    } if course.department else None
                } for course in courses
            ],
            "issue_statistics": {
                "total": assigned_issues.count(),
                "pending": pending_issues,
                "in_progress": in_progress_issues,
                "solved": solved_issues
            }
        }
        return Response(data)

class AdminDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if not request.user.is_admin() and not request.user.is_staff:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        
        # Get all users
        User = get_user_model()
        users = User.objects.all()
        student_count = users.filter(role='STUDENT').count()
        lecturer_count = users.filter(role='LECTURER').count()
        hod_count = users.filter(role='HOD').count()
        admin_count = users.filter(role='ADMIN').count()
        
        # Get all departments
        departments = Department.objects.all()
        
        # Get all issues
        issues = Issue.objects.all()
        pending_issues = issues.filter(status='Pending').count()
        in_progress_issues = issues.filter(status='InProgress').count()
        solved_issues = issues.filter(status='Solved').count()
        
        # Get all courses
        courses = Course.objects.all()
        
        # Recent issues (last 10)
        recent_issues = Issue.objects.order_by('-created_at')[:10]
        
        # Format data
        data = {
            "user": {
                "id": request.user.id,
                "email": request.user.email,
                "first_name": request.user.first_name,
                "last_name": request.user.last_name,
                "role": request.user.role
            },
            "users": [
                {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role
                } for user in users
            ],
            "departments": [
                {
                    "id": dept.id,
                    "department_name": dept.department_name,
                    "department_code": dept.department_code
                } for dept in departments
            ],
            "statistics": {
                "users": {
                    "total": users.count(),
                    "students": student_count,
                    "lecturers": lecturer_count,
                    "hods": hod_count,
                    "admins": admin_count
                },
                "issues": {
                    "total": issues.count(),
                    "pending": pending_issues,
                    "in_progress": in_progress_issues,
                    "solved": solved_issues
                },
                "departments": departments.count(),
                "courses": courses.count()
            },
            "recent_issues": [
                {
                    "id": issue.id,
                    "title": issue.title,
                    "status": issue.status,
                    "created_at": issue.created_at,
                    "student": {
                        "id": issue.student.id,
                        "email": issue.student.email
                    }
                } for issue in recent_issues
            ]
        }
        return Response(data)

# New Views for HOD access - Add these at the end of the file
class DepartmentIssuesView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, pk):
        try:
            # Get the department
            department = Department.objects.get(pk=pk)
            
            # Check if user is admin or HOD of this department
            user = request.user
            if not user.is_staff and not (hasattr(user, 'role') and user.role == 'HOD' and user.department and str(user.department.id) == str(pk)):
                return Response(
                    {"detail": "You do not have permission to access this department's issues."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get issues for this department
            department_courses = Course.objects.filter(department=department)
            department_issues = Issue.objects.filter(course__in=department_courses)
            
            serializer = IssueSerializer(department_issues, many=True)
            return Response(serializer.data)
        except Department.DoesNotExist:
            return Response(
                {"detail": "Department not found."},
                status=status.HTTP_404_NOT_FOUND
            )

class DepartmentStaffView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, pk):
        try:
            # Get the department
            department = Department.objects.get(pk=pk)
            
            # Check if user is admin or HOD of this department
            user = request.user
            if not user.is_staff and not (hasattr(user, 'role') and user.role == 'HOD' and user.department and str(user.department.id) == str(pk)):
                return Response(
                    {"detail": "You do not have permission to access this department's staff."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get staff (lecturers and HOD) for this department
            from users.models import User
            from users.serializers import UserSerializer
            
            department_staff = User.objects.filter(
                department=department, 
                role__in=['HOD', 'LECTURER']
            )
            
            serializer = UserSerializer(department_staff, many=True)
            return Response(serializer.data)
        except Department.DoesNotExist:
            return Response(
                {"detail": "Department not found."},
                status=status.HTTP_404_NOT_FOUND
            )

class DepartmentCoursesView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, pk):
        try:
            # Get the department
            department = Department.objects.get(pk=pk)
            
            # Check if user is admin or HOD of this department
            user = request.user
            if not user.is_staff and not (hasattr(user, 'role') and user.role == 'HOD' and user.department and str(user.department.id) == str(pk)):
                return Response(
                    {"detail": "You do not have permission to access this department's courses."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get courses for this department
            department_courses = Course.objects.filter(department=department)
            
            serializer = CourseSerializer(department_courses, many=True)
            return Response(serializer.data)
        except Department.DoesNotExist:
            return Response(
                {"detail": "Department not found."},
                status=status.HTTP_404_NOT_FOUND
            )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_department(request, user_id):
    try:
        # Check if the requesting user is the same as the user_id or an admin
        if str(request.user.id) != str(user_id) and not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to access this user's department."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get the user
        from users.models import User
        from users.serializers import UserSerializer
        
        user = User.objects.get(pk=user_id)
        
        # If the user is an HOD, return their department
        if hasattr(user, 'role') and user.role == 'HOD' and user.department:
            department_serializer = DepartmentSerializer(user.department)
            return Response({
                "department": department_serializer.data
            })
        else:
            return Response(
                {"detail": "This user is not a Head of Department or has no assigned department."},
                status=status.HTTP_404_NOT_FOUND
            )
    except User.DoesNotExist:
        return Response(
            {"detail": "User not found."},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_staff_issues(request, user_id):
    try:
        # Check if the requesting user is the same as the user_id, an admin, or an HOD
        is_admin = request.user.is_staff
        is_self = str(request.user.id) == str(user_id)
        is_hod_of_same_dept = (
            hasattr(request.user, 'role') and 
            request.user.role == 'HOD' and 
            hasattr(request.user, 'department') and 
            request.user.department
        )
        
        if not (is_admin or is_self or is_hod_of_same_dept):
            return Response(
                {"detail": "You do not have permission to access this user's issues."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get the staff user
        from users.models import User
        staff_user = User.objects.get(pk=user_id)
        
        # Get issues assigned to this staff member
        staff_issues = Issue.objects.filter(assigned_to=staff_user)
        
        # If an HOD is requesting, ensure they can only see issues from their department
        if is_hod_of_same_dept and not is_admin:
            # Get courses in HOD's department
            dept_courses = Course.objects.filter(department=request.user.department)
            # Filter issues to only include those for courses in the HOD's department
            staff_issues = staff_issues.filter(course__in=dept_courses)
        
        serializer = IssueSerializer(staff_issues, many=True)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response(
            {"detail": "User not found."},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Add new HOD-specific issue assignment endpoint
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def hod_assign_issue(request, dept_id, issue_id):
    """
    Special endpoint for HODs to assign issues in their department.
    Only HODs can use this endpoint for their own department issues.
    """
    try:
        # Get the issue and department
        issue = Issue.objects.get(pk=issue_id)
        department = Department.objects.get(pk=dept_id)
        
        # Check if user is HOD of this department
        user = request.user
        if not (hasattr(user, 'role') and user.role == 'HOD' and 
                hasattr(user, 'department') and user.department and 
                str(user.department.id) == str(dept_id)):
            return Response(
                {"detail": "You must be the HOD of this department to assign issues."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if issue belongs to a course in the HOD's department
        course = issue.course
        if not course or course.department.id != department.id:
            return Response(
                {"detail": "This issue does not belong to your department."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get the user_id from request data
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {"detail": "User ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get the user to assign the issue to
            from users.models import User
            assigned_user = User.objects.get(id=user_id)
            
            # Check if the user is a lecturer or HOD from the same department
            if assigned_user.role not in ['LECTURER', 'HOD']:
                return Response(
                    {"detail": "Issues can only be assigned to lecturers or heads of department"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if user belongs to the same department
            if hasattr(assigned_user, 'department') and assigned_user.department and assigned_user.department.id != department.id:
                return Response(
                    {"detail": "You can only assign issues to staff within your department."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Assign the issue
            issue.assigned_to = assigned_user
            issue.status = 'InProgress'  # Update status to in progress
            issue.save()
            
            serializer = IssueSerializer(issue)
            return Response(serializer.data)
            
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
    except Department.DoesNotExist:
        return Response(
            {"detail": "Department not found."},
            status=status.HTTP_404_NOT_FOUND
        )
    except Issue.DoesNotExist:
        return Response(
            {"detail": "Issue not found."},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Add this separately for HOD access
class HODDepartmentDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, pk):
        try:
            # Get the department
            department = Department.objects.get(pk=pk)
            
            # Check if user is admin or HOD of this department
            user = request.user
            # For admin and staff, allow access to any department
            if user.is_staff or user.role == 'ADMIN':
                serializer = DepartmentSerializer(department)
                return Response(serializer.data)
                
            # For HOD, check if they are HOD of this specific department
            if hasattr(user, 'role') and user.role == 'HOD':
                if hasattr(user, 'department') and user.department:
                    if str(user.department.id) == str(pk):
                        serializer = DepartmentSerializer(department)
                        return Response(serializer.data)
                    else:
                        return Response(
                            {"detail": f"You are HOD of department {user.department.id}, not department {pk}."},
                            status=status.HTTP_403_FORBIDDEN
                        )
                else:
                    return Response(
                        {"detail": "You are not assigned to any department."},
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            return Response(
                {"detail": "You do not have permission to access this department's data."},
                status=status.HTTP_403_FORBIDDEN
            )
        except Department.DoesNotExist:
            return Response(
                {"detail": "Department not found."},
                status=status.HTTP_404_NOT_FOUND
            )

# Add an API endpoint for Notifications
class NotificationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing notifications.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Return only notifications for the current user.
        """
        return Notification.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """
        Mark a notification as read.
        """
        notification = self.get_object()
        notification.read = True
        notification.save()
        return Response({"status": "success"})
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """
        Mark all notifications for the current user as read.
        """
        Notification.objects.filter(user=request.user, read=False).update(read=True)
        return Response({"status": "success"})

# Signal handler for issue assignment in the HOD view
@receiver(post_save, sender=Issue)
def handle_issue_assignment(sender, instance, created, **kwargs):
    """
    Signal handler for issue assignments through HOD view.
    Creates notifications when issues are assigned or status changes.
    """
    User = get_user_model()
    
    # When a new issue is created
    if created:
        # Notify admin users about new issue
        admin_users = User.objects.filter(role='ADMIN')
        for admin in admin_users:
            Notification.objects.create(
                user=admin,
                issue=instance,
                message=f"New issue '{instance.title}' has been created by {instance.student.username if instance.student else 'a user'}",
                notification_type='NEW_ISSUE'
            )
        
        # Notify department HODs if applicable
        if instance.course and instance.course.department:
            hod_users = User.objects.filter(
                role='HOD', 
                department=instance.course.department
            )
            for hod in hod_users:
                Notification.objects.create(
                    user=hod,
                    issue=instance,
                    message=f"New issue '{instance.title}' has been created for {instance.course.course_name}",
                    notification_type='NEW_ISSUE'
                )
    
    # When an issue is assigned
    elif instance.assigned_to:
        # Check if this is a new assignment (we'd need to store previous state to accurately detect this)
        # For simplicity, we'll always check if there's an assigned_to user set
        
        # Create notification for the assigned staff if not already notified
        recent_notifications = Notification.objects.filter(
            user=instance.assigned_to,
            issue=instance,
            notification_type='ISSUE_ASSIGNED',
            created_at__gt=timezone.now() - timezone.timedelta(minutes=5)
        )
        
        if not recent_notifications.exists():
            Notification.objects.create(
                user=instance.assigned_to,
                issue=instance,
                message=f"Issue '{instance.title}' has been assigned to you",
                notification_type='ISSUE_ASSIGNED'
            )
    
    # When issue status changes
    if not created and instance.status:
        # Notify the student who created the issue
        if instance.student:
            Notification.objects.create(
                user=instance.student,
                issue=instance,
                message=f"Your issue '{instance.title}' status has been updated to {instance.status}",
                notification_type='STATUS_UPDATE'
            )
