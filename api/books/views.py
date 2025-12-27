from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Avg, Count
from django.db import models
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Book, BookImage
from .serializers import CategorySerializer, BookSerializer, BookCreateSerializer
from reviews.models import Wishlist


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.filter(is_active=True)
    serializer_class = BookSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'condition', 'seller', 'is_active']
    search_fields = ['title', 'author', 'description', 'isbn']
    ordering_fields = ['price', 'created_at', 'title', 'has_cover_image']

    def get_serializer_class(self):
        if self.action == 'create':
            return BookCreateSerializer
        return BookSerializer

    def get_queryset(self):
        # For authenticated users, show their own books regardless of is_active status
        if self.request.user.is_authenticated and self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            # For detail actions, allow access to own books even if inactive
            return Book.objects.all()
        
        # For list actions, use the default filtered queryset
        queryset = super().get_queryset()
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        # Filter by rating
        min_rating = self.request.query_params.get('min_rating')
        if min_rating:
            queryset = queryset.annotate(avg_rating=Avg('reviews__rating')).filter(avg_rating__gte=min_rating)
        
        # Add custom ordering to prioritize books with cover images
        # Books with cover images come first, then by creation date (newest first)
        # This improves user experience by showing visually appealing books first
        queryset = queryset.annotate(
            has_cover_image=models.Case(
                models.When(cover_image__isnull=False, cover_image__exact='', then=models.Value(False)),
                models.When(cover_image__isnull=True, then=models.Value(False)),
                default=models.Value(True),
                output_field=models.BooleanField(),
            )
        ).order_by('-has_cover_image', '-created_at')
        
        return queryset

    def get_object(self):
        """Override to check permissions for inactive books"""
        obj = super().get_object()
        
        # If the book is inactive, only the seller can access it
        if not obj.is_active and self.request.user.is_authenticated:
            if obj.seller != self.request.user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You don't have permission to access this book.")
        
        return obj

    def update(self, request, *args, **kwargs):
        """Custom update method to handle image uploads"""
        instance = self.get_object()
        
        # Check if user is the seller
        if instance.seller != request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't have permission to update this book.")
        
        # Handle cover image
        if 'cover_image' in request.FILES:
            instance.cover_image = request.FILES['cover_image']
        
        # Handle additional images
        if 'additional_images' in request.FILES:
            additional_images = request.FILES.getlist('additional_images')
            print(f"Processing {len(additional_images)} additional images")
            for image_file in additional_images:
                print(f"Creating BookImage for file: {image_file.name}")
                BookImage.objects.create(book=instance, image=image_file)
        
        # Handle keeping existing images
        keep_images = request.data.getlist('keep_images')
        print(f"Keep images: {keep_images}")
        
        # Only delete existing images if keep_images is explicitly provided
        # If keep_images is empty but we're adding new images, don't delete anything
        if keep_images is not None and len(keep_images) == 0 and 'additional_images' not in request.FILES:
            # Only delete all images if no new images are being added and keep_images is explicitly empty
            deleted_count = instance.images.all().delete()[0]
            print(f"Deleted all {deleted_count} images")
        elif keep_images:
            # Delete images that are not in keep_images
            deleted_count = instance.images.exclude(id__in=keep_images).delete()[0]
            print(f"Deleted {deleted_count} images")
        else:
            print("No images to delete")
        
        # Update other fields
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Save the instance to persist cover_image changes
        instance.save()
        
        print(f"Final image count: {instance.images.count()}")
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_books(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        books = Book.objects.filter(seller=request.user)
        serializer = self.get_serializer(books, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_to_wishlist(self, request, pk=None):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        book = self.get_object()
        wishlist_item, created = Wishlist.objects.get_or_create(user=request.user, book=book)
        
        if created:
            return Response({'message': 'Added to wishlist'}, status=status.HTTP_201_CREATED)
        else:
            return Response({'message': 'Already in wishlist'})

    @action(detail=True, methods=['delete'])
    def remove_from_wishlist(self, request, pk=None):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        book = self.get_object()
        try:
            wishlist_item = Wishlist.objects.get(user=request.user, book=book)
            wishlist_item.delete()
            return Response({'message': 'Removed from wishlist'})
        except Wishlist.DoesNotExist:
            return Response({'error': 'Not in wishlist'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def top_sold(self, request):
        """Get top sold books based on order count"""
        from orders.models import OrderItem
        
        # Get books with their order count
        top_books = Book.objects.filter(is_active=True).annotate(
            order_count=Count('orderitem')
        ).order_by('-order_count', '-created_at')[:8]
        
        serializer = self.get_serializer(top_books, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def inventory_analysis(self, request, pk=None):
        """Get detailed inventory analysis for a specific book"""
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        book = self.get_object()
        
        # Check if user is the seller
        if book.seller != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Import OrderItem for sales data
        from orders.models import OrderItem
        from django.db.models import Sum
        from datetime import datetime, timedelta
        
        # Calculate EOQ (Economic Order Quantity)
        # EOQ = sqrt((2 * Annual Demand * Order Cost) / Holding Cost)
        # Simplified calculation using recent sales data
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_sales = OrderItem.objects.filter(
            book=book,
            order__created_at__gte=thirty_days_ago,
            order__status__in=['confirmed', 'shipped', 'delivered']
        ).aggregate(total_sold=Sum('quantity'))['total_sold'] or 0
        
        # Estimate annual demand (30 days * 12)
        annual_demand = recent_sales * 12
        order_cost = 10  # Estimated order cost
        holding_cost_per_unit = book.price * 0.2  # 20% of book price as holding cost
        
        eoq = int((2 * annual_demand * order_cost / holding_cost_per_unit) ** 0.5) if holding_cost_per_unit > 0 else 10
        
        # Demand forecast (simple moving average)
        demand_forecast = {
            'next_month': annual_demand / 12,
            'next_quarter': annual_demand / 4,
            'next_year': annual_demand
        }
        
        return Response({
            'book': BookSerializer(book).data,
            'eoq_analysis': {
                'economic_order_quantity': eoq,
                'annual_demand': annual_demand,
                'order_cost': order_cost,
                'holding_cost_per_unit': holding_cost_per_unit
            },
            'demand_forecast': demand_forecast
        })

    @action(detail=False, methods=['get'])
    def inventory_recommendations(self, request):
        """Get comprehensive inventory recommendations for seller"""
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        if not request.user.is_seller:
            return Response({'error': 'Seller account required'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get seller's books
        seller_books = Book.objects.filter(seller=request.user, is_active=True)
        total_books = seller_books.count()
        total_inventory_value = sum(book.price * book.quantity for book in seller_books)
        
        # Calculate critical items (quantity <= 2)
        critical_items = seller_books.filter(quantity__lte=2)
        critical_items_count = critical_items.count()
        
        # Calculate low stock items (quantity <= 5)
        low_stock_items = seller_books.filter(quantity__lte=5)
        low_stock_items_count = low_stock_items.count()
        
        # Generate recommendations
        high_priority = []
        medium_priority = []
        low_priority = []
        
        for book in critical_items:
            high_priority.append(f"Restock '{book.title}' - Only {book.quantity} left")
        
        for book in low_stock_items.exclude(id__in=critical_items.values_list('id', flat=True)):
            medium_priority.append(f"Monitor '{book.title}' - {book.quantity} in stock")
        
        if total_books == 0:
            low_priority.append("Add your first book to start selling")
        elif total_books < 5:
            low_priority.append("Consider adding more books to increase your catalog")
        
        return Response({
            'total_books': total_books,
            'total_inventory_value': total_inventory_value,
            'critical_items_count': critical_items_count,
            'low_stock_items_count': low_stock_items_count,
            'reorder_recommendations_count': critical_items_count + low_stock_items_count,
            'high_priority_recommendations': high_priority,
            'medium_priority_recommendations': medium_priority,
            'low_priority_recommendations': low_priority,
            'critical_items': [
                {
                    'book_id': book.id,
                    'title': book.title,
                    'author': book.author,
                    'current_quantity': book.quantity,
                    'reorder_point': 2,
                    'economic_order_quantity': max(5, book.quantity * 2)
                }
                for book in critical_items
            ],
            'low_stock_items': [
                {
                    'book_id': book.id,
                    'title': book.title,
                    'author': book.author,
                    'current_quantity': book.quantity,
                    'reorder_point': 5,
                    'economic_order_quantity': max(10, book.quantity * 2)
                }
                for book in low_stock_items
            ]
        })

    @action(detail=False, methods=['get'])
    def abc_analysis(self, request):
        """Get ABC analysis for seller's inventory"""
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        if not request.user.is_seller:
            return Response({'error': 'Seller account required'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get seller's books
        seller_books = Book.objects.filter(seller=request.user, is_active=True)
        
        if not seller_books.exists():
            return Response({
                'category_summary': {
                    'A': {'count': 0, 'value': 0},
                    'B': {'count': 0, 'value': 0},
                    'C': {'count': 0, 'value': 0}
                }
            })
        
        # Calculate total inventory value
        total_value = sum(book.price * book.quantity for book in seller_books)
        
        # Sort books by value (price * quantity)
        books_with_value = [(book, book.price * book.quantity) for book in seller_books]
        books_with_value.sort(key=lambda x: x[1], reverse=True)
        
        # Calculate cumulative value
        cumulative_value = 0
        category_a = []
        category_b = []
        category_c = []
        
        for book, value in books_with_value:
            cumulative_value += value
            percentage = (cumulative_value / total_value) * 100
            
            if percentage <= 80:
                category_a.append(book)
            elif percentage <= 95:
                category_b.append(book)
            else:
                category_c.append(book)
        
        return Response({
            'category_summary': {
                'A': {
                    'count': len(category_a),
                    'value': sum(book.price * book.quantity for book in category_a)
                },
                'B': {
                    'count': len(category_b),
                    'value': sum(book.price * book.quantity for book in category_b)
                },
                'C': {
                    'count': len(category_c),
                    'value': sum(book.price * book.quantity for book in category_c)
                }
            }
        })

    @action(detail=False, methods=['get'])
    def stock_turnover(self, request):
        """Get stock turnover analysis for seller's inventory"""
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        if not request.user.is_seller:
            return Response({'error': 'Seller account required'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get seller's books
        seller_books = Book.objects.filter(seller=request.user, is_active=True)
        
        if not seller_books.exists():
            return Response({
                'turnover_summary': {'high': 0, 'medium': 0, 'low': 0},
                'books': []
            })
        
        # Import OrderItem for sales data
        from orders.models import OrderItem
        from django.db.models import Sum
        from datetime import datetime, timedelta
        
        # Calculate turnover for each book
        books_turnover = []
        high_turnover = 0
        medium_turnover = 0
        low_turnover = 0
        
        for book in seller_books:
            # Get sales in the last 30 days
            thirty_days_ago = datetime.now() - timedelta(days=30)
            sales_quantity = OrderItem.objects.filter(
                book=book,
                order__created_at__gte=thirty_days_ago,
                order__status__in=['confirmed', 'shipped', 'delivered']
            ).aggregate(total_sold=Sum('quantity'))['total_sold'] or 0
            
            # Calculate turnover ratio (sales / average inventory)
            avg_inventory = book.quantity  # Simplified: current inventory as average
            turnover_ratio = sales_quantity / avg_inventory if avg_inventory > 0 else 0
            
            # Categorize turnover
            if turnover_ratio >= 0.5:  # High turnover (50% or more of inventory sold)
                turnover_category = 'high'
                high_turnover += 1
            elif turnover_ratio >= 0.2:  # Medium turnover (20-50% of inventory sold)
                turnover_category = 'medium'
                medium_turnover += 1
            else:  # Low turnover (less than 20% of inventory sold)
                turnover_category = 'low'
                low_turnover += 1
            
            books_turnover.append({
                'book_id': book.id,
                'title': book.title,
                'current_stock': book.quantity,
                'turnover_ratio': round(turnover_ratio, 2),
                'turnover_category': turnover_category
            })
        
        return Response({
            'turnover_summary': {
                'high': high_turnover,
                'medium': medium_turnover,
                'low': low_turnover
            },
            'books': books_turnover
        })
