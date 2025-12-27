from django.contrib import admin
from .models import Category, Book, BookImage

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_at']
    search_fields = ['name']
    ordering = ['name']

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'price', 'condition', 'category', 'seller', 'quantity', 'is_active', 'created_at']
    list_filter = ['condition', 'category', 'is_active', 'created_at']
    search_fields = ['title', 'author', 'isbn']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(BookImage)
class BookImageAdmin(admin.ModelAdmin):
    list_display = ['book', 'caption', 'created_at']
    list_filter = ['created_at']
    search_fields = ['book__title', 'caption']
