# backend/users/views.py
from rest_framework import status, generics
from rest_framework import serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import NotFound

from .models import User
from .serializers import UserSerializer, RegistrationSerializer

class UserInfoView(RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        user = self.request.user
        if not user.is_authenticated or user.is_anonymous:
            raise NotFound("User not found.")
        return user

class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.all()

class RegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        
        try:
            if serializer.is_valid(raise_exception=True):
                user = serializer.save()
                
                # Set user as verified immediately
                user.is_verified = True
                user.save()
                
                # Generate tokens for immediate login
                refresh = RefreshToken.for_user(user)
                
                return Response({
                    'message': 'User registered successfully',
                    'email': user.email,
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                }, status=status.HTTP_201_CREATED)
        
        except serializers.ValidationError:
            return Response({
                'error': 'Registration failed',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Handle password separately to properly hash it
        password = request.data.get('password')
        if password:
            instance.set_password(password)
            # Remove password from data to prevent it from being overwritten
            # by the serializer update method
            request.data.pop('password', None)
        
        # Handle department_code if present
        department_code = request.data.get('department_code')
        if department_code:
            from api.models import Department
            try:
                department = Department.objects.get(department_code=department_code)
                instance.department = department
            except Department.DoesNotExist:
                return Response(
                    {"department_code": f"Department with code {department_code} does not exist"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Remove from data to prevent serializer confusion
            request.data.pop('department_code', None)
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)