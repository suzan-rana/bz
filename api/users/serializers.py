from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, SellerKYC

class UserSerializer(serializers.ModelSerializer):
    kyc_status = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone', 'address', 'is_seller', 'profile_picture', 'created_at', 'kyc_status']
        read_only_fields = ['id', 'created_at', 'kyc_status']
    
    def get_kyc_status(self, obj):
        """Get KYC status for sellers"""
        if obj.is_seller:
            try:
                kyc = obj.kyc
                return {
                    'status': kyc.status,
                    'submitted_at': kyc.submitted_at,
                    'reviewed_at': kyc.reviewed_at,
                    'admin_notes': kyc.admin_notes
                }
            except SellerKYC.DoesNotExist:
                return {
                    'status': 'not_submitted',
                    'submitted_at': None,
                    'reviewed_at': None,
                    'admin_notes': None
                }
        return None

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'confirm_password', 'first_name', 'last_name', 'phone', 'address', 'is_seller']

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        
        # Generate username from email if not provided
        email = validated_data['email']
        username = email.split('@')[0]  # Use part before @ as username
        # Ensure username is unique
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        validated_data['username'] = username
        
        user = User.objects.create_user(**validated_data)
        return user

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Must include email and password')
        return attrs

class SellerKYCSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    reviewed_by = UserSerializer(read_only=True)

    class Meta:
        model = SellerKYC
        fields = [
            'id', 'user', 'business_name', 'business_address', 'business_phone', 
            'business_email', 'tax_id', 'business_license', 'id_document', 
            'proof_of_address', 'bank_account_number', 'bank_name', 'status', 
            'admin_notes', 'submitted_at', 'reviewed_at', 'reviewed_by'
        ]
        read_only_fields = ['id', 'user', 'status', 'admin_notes', 'submitted_at', 'reviewed_at', 'reviewed_by']

class SellerKYCCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerKYC
        fields = [
            'business_name', 'business_address', 'business_phone', 'business_email',
            'tax_id', 'business_license', 'id_document', 'proof_of_address',
            'bank_account_number', 'bank_name'
        ]

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class SellerKYCUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerKYC
        fields = [
            'business_name', 'business_address', 'business_phone', 'business_email',
            'tax_id', 'business_license', 'id_document', 'proof_of_address',
            'bank_account_number', 'bank_name'
        ]
