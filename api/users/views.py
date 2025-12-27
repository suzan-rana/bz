from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login, logout
from django.utils import timezone
from django.db import models
from .models import User, SellerKYC
from .serializers import (
    UserSerializer, UserRegistrationSerializer, UserLoginSerializer,
    SellerKYCSerializer, SellerKYCCreateSerializer, SellerKYCUpdateSerializer
)

class AuthViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def register(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def login(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def logout(self, request):
        logout(request)
        return Response({'message': 'Logged out successfully'})

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.action == 'list' and not self.request.user.is_staff:
            return User.objects.filter(id=self.request.user.id)
        return super().get_queryset()

    @action(detail=False, methods=['get'])
    def profile(self, request):
        return Response(UserSerializer(request.user).data)

    @action(detail=False, methods=['put'])
    def update_profile(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get dashboard statistics for the user"""
        user = request.user
        
        if user.is_seller:
            # Seller stats
            from books.models import Book
            from orders.models import Order, OrderItem
            
            total_books = Book.objects.filter(seller=user).count()
            active_books = Book.objects.filter(seller=user, is_active=True).count()
            total_sales = OrderItem.objects.filter(book__seller=user).aggregate(
                total=models.Sum('price')
            )['total'] or 0
            total_orders = Order.objects.filter(items__book__seller=user).distinct().count()
            
            return Response({
                'total_books': total_books,
                'active_books': active_books,
                'total_sales': float(total_sales),
                'total_orders': total_orders,
                'user_type': 'seller'
            })
        else:
            # Buyer stats
            from orders.models import Order
            from reviews.models import Review, Wishlist
            
            total_orders = Order.objects.filter(buyer=user).count()
            total_reviews = Review.objects.filter(reviewer=user).count()
            wishlist_count = Wishlist.objects.filter(user=user).count()
            
            return Response({
                'total_orders': total_orders,
                'total_reviews': total_reviews,
                'wishlist_count': wishlist_count,
                'user_type': 'buyer'
            })

class SellerKYCViewSet(viewsets.ModelViewSet):
    serializer_class = SellerKYCSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return SellerKYC.objects.all()
        return SellerKYC.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return SellerKYCCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return SellerKYCUpdateSerializer
        return SellerKYCSerializer

    @action(detail=True, methods=['patch'])
    def review(self, request, pk=None):
        """Admin review of KYC application"""
        if not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        kyc = self.get_object()
        new_status = request.data.get('status')
        admin_notes = request.data.get('admin_notes', '')
        
        if new_status in dict(SellerKYC.STATUS_CHOICES):
            kyc.status = new_status
            kyc.admin_notes = admin_notes
            kyc.reviewed_at = timezone.now()
            kyc.reviewed_by = request.user
            
            # If approved, make user a seller
            if new_status == 'approved':
                kyc.user.is_seller = True
                kyc.user.save()
            
            kyc.save()
            return Response(SellerKYCSerializer(kyc).data)
        else:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def my_kyc(self, request):
        """Get current user's KYC status"""
        try:
            kyc = SellerKYC.objects.get(user=request.user)
            return Response(SellerKYCSerializer(kyc).data)
        except SellerKYC.DoesNotExist:
            return Response({'message': 'No KYC application found'}, status=status.HTTP_404_NOT_FOUND)
