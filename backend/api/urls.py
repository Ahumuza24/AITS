# backend/api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StudentDashboardView, 
    LecturerDashboardView, 
    AdminDashboardView,
    CollegeListView,
    CollegeDetailView,
    CollegeCreateView,
    DepartmentCreateView,
    DepartmentListView,
    DepartmentDetailView,
    CourseListView,
    CourseDetailView,
    CourseCreateView,
    IssueViewSet,
    IssueCreateView,
    # New HOD-specific views
    HODDepartmentDetailView,
    DepartmentIssuesView,
    DepartmentStaffView,
    DepartmentCoursesView,
    get_user_department,
    get_staff_issues,
    hod_assign_issue,
    NotificationViewSet,
)

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'issues', IssueViewSet, basename='issue')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('dashboard/student/', StudentDashboardView.as_view(), name='student_dashboard'),
    path('dashboard/lecturer/', LecturerDashboardView.as_view(), name='lecturer_dashboard'),
    path('dashboard/admin/', AdminDashboardView.as_view(), name='admin_dashboard'),
    path('college/', CollegeListView.as_view(), name='college_list'),  
    path('college/<int:pk>/', CollegeDetailView.as_view(), name='college-detail'),
    path('admin/api/college/add/', CollegeCreateView.as_view(), name='college-add'),
    path('department/', DepartmentListView.as_view(), name='department-list'),
    path('department/<int:pk>/', DepartmentDetailView.as_view(), name='department-detail'),
    path('admin/api/department/add/', DepartmentCreateView.as_view(), name='department-add'),
    path('course/', CourseListView.as_view(), name='course-list'),
    path('course/<int:pk>/', CourseDetailView.as_view(), name='course-detail'),
    path('admin/api/course/add/', CourseCreateView.as_view(), name='course-add'),
    path('admin/api/issue/add/', IssueCreateView.as_view(), name='issue-add'),
    
    # New HOD-specific URL patterns
    path('hod/department/<int:pk>/', HODDepartmentDetailView.as_view(), name='hod-department-detail'),
    path('department/<int:pk>/issues/', DepartmentIssuesView.as_view(), name='department-issues'),
    path('department/<int:pk>/staff/', DepartmentStaffView.as_view(), name='department-staff'),
    path('department/<int:pk>/courses/', DepartmentCoursesView.as_view(), name='department-courses'),
    path('department/<int:dept_id>/issues/<int:issue_id>/assign/', hod_assign_issue, name='hod-assign-issue'),
    path('users/<int:user_id>/department/', get_user_department, name='user-department'),
    path('users/<int:user_id>/issues/', get_staff_issues, name='staff-issues'),
    
    # Include the router URLs
    path('', include(router.urls)),
]