from django.contrib import admin
from .models import Review, Wishlist

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['book', 'reviewer', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['book__title', 'reviewer__email']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ['user', 'book', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email', 'book__title']
    ordering = ['-created_at']
