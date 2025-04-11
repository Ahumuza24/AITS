# backend/users/serializers.py
from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone', 'role', 'college', 'department', 'is_verified']
        read_only_fields = ['is_verified']

class RegistrationSerializer(serializers.ModelSerializer):
    college_code = serializers.CharField(write_only=True, required=False, allow_blank=True)
    department_code = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name', 'phone', 'role', 'college_code', 'department_code']
    
    def validate(self, data):
        """
        Validate that HOD users have a department code
        """
        role = data.get('role')
        department_code = data.get('department_code')
        
        if role == 'HOD' and not department_code:
            raise serializers.ValidationError("Department code is required for Head of Department users")
        
        return data
    
    def create(self, validated_data):
        college_code = validated_data.pop('college_code', None)
        department_code = validated_data.pop('department_code', None)
        
        # Handle college association if college_code provided
        if college_code:
            from api.models import College
            try:
                college = College.objects.get(code=college_code)
                validated_data['college'] = college
            except College.DoesNotExist:
                pass
        
        # Handle department association for HOD role
        if department_code and validated_data.get('role') == 'HOD':
            from api.models import Department
            try:
                department = Department.objects.get(department_code=department_code)
                validated_data['department'] = department
            except Department.DoesNotExist:
                raise serializers.ValidationError({"department_code": "Department with this code does not exist"})
        
        # Create user without explicitly providing username
        user = User.objects.create_user(**validated_data)
        return user