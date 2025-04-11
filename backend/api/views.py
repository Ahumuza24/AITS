# backend/api/views.py
from rest_framework import status, permissions, viewsets
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import College, Department, Course, Issue
from .serializers import CollegeSerializer, DepartmentSerializer, CourseSerializer, IssueSerializer, IssueCreateSerializer
from rest_framework.permissions import IsAdminUser, AllowAny
from rest_framework.decorators import action
from rest_framework.decorators import api_view, permission_classes

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
