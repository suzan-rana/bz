from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, SellerKYC

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['email', 'username', 'first_name', 'last_name', 'is_seller', 'is_staff', 'is_active']
    list_filter = ['is_seller', 'is_staff', 'is_active', 'created_at']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-created_at']
    
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('phone', 'address', 'is_seller', 'profile_picture')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('phone', 'address', 'is_seller', 'profile_picture')}),
    )

@admin.register(SellerKYC)
class SellerKYCAdmin(admin.ModelAdmin):
    list_display = ['user', 'business_name', 'status', 'submitted_at', 'reviewed_at']
    list_filter = ['status', 'submitted_at', 'reviewed_at']
    search_fields = ['user__email', 'business_name', 'business_email']
    ordering = ['-submitted_at']
    readonly_fields = ['submitted_at', 'reviewed_at', 'reviewed_by']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'business_name', 'business_address', 'business_phone', 'business_email')
        }),
        ('Business Information', {
            'fields': ('tax_id', 'business_license', 'bank_account_number', 'bank_name')
        }),
        ('Documents', {
            'fields': ('id_document', 'proof_of_address')
        }),
        ('Review Information', {
            'fields': ('status', 'admin_notes', 'submitted_at', 'reviewed_at', 'reviewed_by')
        }),
    )
