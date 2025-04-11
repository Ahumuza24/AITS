# backend/api/views.py
from rest_framework import status, permissions, viewsets
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import College, Department, Course, Issue
from .serializers import CollegeSerializer, DepartmentSerializer, CourseSerializer, IssueSerializer, IssueCreateSerializer
from rest_framework.permissions import IsAdminUser, AllowAny
from rest_framework.decorators import action

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

class CourseCreateView(APIView):
    permission_classes = [IsAdminUser]  # Requires admin user
    
    def post(self, request):
        serializer = CourseSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class IsOwnerOrStaffOrAssignedTo(permissions.BasePermission):
    """
    Custom permission to allow:
    1. Staff to access any issue
    2. Students to access their own issues
    3. Lecturers/HODs to access issues assigned to them
    """
    def has_object_permission(self, request, view, obj):
        # Staff can access any object
        if request.user.is_staff:
            return True
        
        # Check if the user is the student who created the issue
        if hasattr(obj, 'student') and obj.student == request.user:
            return True
            
        # Check if the user is the lecturer/HOD assigned to the issue
        if hasattr(obj, 'assigned_to') and obj.assigned_to == request.user:
            return True
            
        return False

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
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaffOrAssignedTo]
    
    def get_queryset(self):
        """
        This view should return:
        1. All issues for staff users
        2. Own issues for students
        3. Assigned issues for lecturers/HODs
        """
        user = self.request.user
        
        # Staff can see all issues
        if user.is_staff:
            return Issue.objects.all()
            
        # Lecturers/HODs can see issues assigned to them
        if hasattr(user, 'role') and user.role in ['LECTURER', 'HOD']:
            return Issue.objects.filter(assigned_to=user)
            
        # Students can see their own issues
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
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """
        Endpoint for updating issue status.
        Staff and assigned lecturers/HODs can update status.
        """
        issue = self.get_object()
        
        # Check if user has permission to update status
        if not (request.user.is_staff or 
                (hasattr(request.user, 'role') and 
                 request.user.role in ['LECTURER', 'HOD'] and 
                 issue.assigned_to == request.user)):
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        new_status = request.data.get('status')
        
        if new_status not in dict(Issue.STATUS_CHOICES):
            return Response(
                {"detail": f"Invalid status. Must be one of {dict(Issue.STATUS_CHOICES).keys()}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        issue.status = new_status
        issue.save()
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
            if not hasattr(assigned_user, 'role') or assigned_user.role not in ['LECTURER', 'HOD']:
                return Response(
                    {"detail": "Issues can only be assigned to lecturers or heads of department"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Assign the issue
            issue.assigned_to = assigned_user
            issue.status = 'InProgress'  # Update status to in progress
            issue.save()
            
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


# class StudentDashboardView(APIView):
#     permission_classes = [permissions.IsAuthenticated]
    
#     def get(self, request):
#         if not request.user.is_student():
#             return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        
#         # Mock data for student dashboard
#         data = {
#             "courses": [
#                 {"id": 1, "title": "Introduction to Programming", "grade": "A-"},
#                 {"id": 2, "title": "Data Structures", "grade": "B+"},
#                 {"id": 3, "title": "Algorithms", "grade": "In Progress"}
#             ],
#             "announcements": [
#                 {"id": 1, "title": "Exam Schedule Posted", "date": "2025-03-05"},
#                 {"id": 2, "title": "Lab Submission Deadline Extended", "date": "2025-03-08"}
#             ],
#             "upcoming_deadlines": [
#                 {"id": 1, "title": "Programming Assignment 3", "due_date": "2025-03-15"},
#                 {"id": 2, "title": "Group Project Proposal", "due_date": "2025-03-20"}
#             ]
#         }
#         return Response(data)

# class LecturerDashboardView(APIView):
#     permission_classes = [permissions.IsAuthenticated]
    
#     def get(self, request):
#         if not request.user.is_lecturer():
#             return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        
#         # Mock data for lecturer dashboard
#         data = {
#             "courses": [
#                 {"id": 1, "title": "Introduction to Programming", "students": 45},
#                 {"id": 2, "title": "Advanced Web Development", "students": 30}
#             ],
#             "upcoming_classes": [
#                 {"id": 1, "course": "Introduction to Programming", "time": "Monday, 10:00 AM"},
#                 {"id": 2, "course": "Advanced Web Development", "time": "Wednesday, 2:00 PM"}
#             ],
#             "pending_grading": [
#                 {"id": 1, "title": "Assignment 2", "submissions": 42, "course": "Introduction to Programming"},
#                 {"id": 2, "title": "Midterm Exam", "submissions": 28, "course": "Advanced Web Development"}
#             ]
#         }
#         return Response(data)

# class AdminDashboardView(APIView):
#     permission_classes = [permissions.IsAuthenticated]
    
#     def get(self, request):
#         if not request.user.is_admin():
#             return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        
#         # Mock data for admin dashboard
#         data = {
#             "users": {
#                 "total": 540,
#                 "students": 500,
#                 "lecturers": 35,
#                 "admins": 5
#             },
#             "courses": {
#                 "active": 42,
#                 "archived": 15
#             },
#             "system_health": {
#                 "status": "Good",
#                 "uptime": "99.8%",
#                 "recent_issues": []
#             },
#             "recent_activities": [
#                 {"id": 1, "type": "User Registration", "details": "5 new users registered", "date": "2025-03-08"},
#                 {"id": 2, "type": "Course Created", "details": "New course: Machine Learning", "date": "2025-03-07"},
#                 {"id": 3, "type": "Grade Update", "details": "Introduction to Programming grades posted", "date": "2025-03-06"}
#             ]
#         }
#         return Response(data)
