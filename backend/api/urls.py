# backend/api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    # StudentDashboardView, 
    # LecturerDashboardView, 
    # AdminDashboardView,
    CollegeListView,
    CollegeCreateView,
    DepartmentCreateView,
    DepartmentListView,
    CourseListView,
    CourseCreateView,
    IssueViewSet,
    IssueCreateView,
    # New HOD-specific views
    DepartmentDetailView,
    DepartmentIssuesView,
    DepartmentStaffView,
    DepartmentCoursesView,
    get_user_department,
)

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'issues', IssueViewSet, basename='issue')

urlpatterns = [
    # path('dashboard/student/', StudentDashboardView.as_view(), name='student_dashboard'),
    # path('dashboard/lecturer/', LecturerDashboardView.as_view(), name='lecturer_dashboard'),
    # path('dashboard/admin/', AdminDashboardView.as_view(), name='admin_dashboard'),
    path('college/', CollegeListView.as_view(), name='college_list'),  
    path('admin/api/college/add/', CollegeCreateView.as_view(), name='college-add'),
    path('department/', DepartmentListView.as_view(), name='department-list'),
    path('admin/api/department/add/', DepartmentCreateView.as_view(), name='department-add'),
    path('course/', CourseListView.as_view(), name='course-list'),
    path('admin/api/course/add/', CourseCreateView.as_view(), name='course-add'),
    path('admin/api/issue/add/', IssueCreateView.as_view(), name='issue-add'),
    
    # New HOD-specific URL patterns
    path('department/<int:pk>/', DepartmentDetailView.as_view(), name='department-detail'),
    path('department/<int:pk>/issues/', DepartmentIssuesView.as_view(), name='department-issues'),
    path('department/<int:pk>/staff/', DepartmentStaffView.as_view(), name='department-staff'),
    path('department/<int:pk>/courses/', DepartmentCoursesView.as_view(), name='department-courses'),
    path('users/<int:user_id>/department/', get_user_department, name='user-department'),
    
    # Include the router URLs
    path('', include(router.urls)),
]