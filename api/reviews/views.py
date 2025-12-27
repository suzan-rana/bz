from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Review, Wishlist
from .serializers import ReviewSerializer, WishlistSerializer
from orders.models import Order, OrderItem

# Create your views here.

from rest_framework.permissions import IsAuthenticated, AllowAny

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    
    def get_permissions(self):
        # Allow anyone to read reviews, but require authentication for create/update/delete
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        book_id = self.request.query_params.get('book_id')
        if book_id:
            return Review.objects.filter(book_id=book_id)
        return Review.objects.all()

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)

    @action(detail=False, methods=['get'])
    def can_review(self, request):
        """Check if the current user can review a specific book"""
        book_id = request.query_params.get('book_id')
        if not book_id:
            return Response({'error': 'book_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not request.user.is_authenticated:
            return Response({'can_review': False, 'reason': 'User not authenticated'})
        
        # Check if user has already reviewed this book
        existing_review = Review.objects.filter(book_id=book_id, reviewer=request.user).first()
        if existing_review:
            return Response({
                'can_review': False, 
                'reason': 'Already reviewed',
                'existing_review': {
                    'id': existing_review.id,
                    'rating': existing_review.rating,
                    'comment': existing_review.comment,
                    'created_at': existing_review.created_at
                }
            })
        
        # Check if user has ordered this book
        has_ordered = Order.objects.filter(
            buyer=request.user,
            items__book_id=book_id,
            status__in=['delivered', 'completed']
        ).exists()
        
        if not has_ordered:
            return Response({
                'can_review': False, 
                'reason': 'Must purchase and receive the book first'
            })
        
        return Response({'can_review': True})

class WishlistViewSet(viewsets.ModelViewSet):
    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
