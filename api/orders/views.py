from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
import requests
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderCreateSerializer, OrderItemSerializer

# Create your views here.

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # For sellers, show orders for their books
        if self.request.user.is_seller:
            return Order.objects.filter(items__book__seller=self.request.user).distinct()
        # For buyers, show their own orders
        return Order.objects.filter(buyer=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        
        if new_status in dict(Order.STATUS_CHOICES):
            # Update order status
            order.status = new_status
            
            # Auto-update payment status based on order status
            if new_status == 'delivered':
                # When order is delivered, mark payment as completed if it was pending
                if order.payment_status == 'pending':
                    order.payment_status = 'completed'
            elif new_status == 'cancelled':
                # When order is cancelled, mark payment as cancelled
                order.payment_status = 'cancelled'
            
            order.save()
            return Response({'status': 'updated'})
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def verify_khalti_payment(self, request, pk=None):
        """Verify Khalti payment and update order status"""
        order = self.get_object()
        khalti_token = request.data.get('token')
        
        if not khalti_token:
            return Response({'error': 'Khalti token required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Verify payment with Khalti
            khalti_response = self.verify_khalti_payment_with_api(khalti_token, order.total_amount)
            
            if khalti_response.get('success'):
                # Update order with payment details
                order.payment_status = 'completed'
                order.status = 'paid'
                order.khalti_payment_id = khalti_response.get('payment_id')
                order.khalti_transaction_id = khalti_response.get('transaction_id')
                order.save()
                
                return Response({
                    'success': True,
                    'message': 'Payment verified successfully',
                    'order_id': order.id
                })
            else:
                order.payment_status = 'failed'
                order.save()
                return Response({
                    'success': False,
                    'message': 'Payment verification failed'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            order.payment_status = 'failed'
            order.save()
            return Response({
                'success': False,
                'message': f'Payment verification error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def verify_khalti_payment_with_api(self, token, amount):
        """Verify payment with Khalti API"""
        import os
        
        # Khalti verification URL
        url = "https://khalti.com/api/v2/payment/verify/"
        
        # Headers for Khalti API
        headers = {
            "Authorization": f"Key {os.getenv('KHALTI_SECRET_KEY', 'test_secret_key')}"
        }
        
        # Data to send
        data = {
            "token": token,
            "amount": int(amount * 100)  # Convert to paisa
        }
        
        try:
            response = requests.post(url, headers=headers, data=data)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get('success'):
                return {
                    'success': True,
                    'payment_id': result.get('payment_id'),
                    'transaction_id': result.get('transaction_id'),
                    'amount': result.get('amount'),
                    'mobile': result.get('mobile'),
                    'type': result.get('type')
                }
            else:
                return {
                    'success': False,
                    'message': result.get('message', 'Payment verification failed')
                }
                
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'message': f'Network error: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Verification error: {str(e)}'
            }

    @action(detail=True, methods=['post'])
    def cancel_order(self, request, pk=None):
        """Cancel an order"""
        order = self.get_object()
        
        if order.status in ['pending', 'paid']:
            order.status = 'cancelled'
            order.payment_status = 'cancelled'
            order.save()
            return Response({'message': 'Order cancelled successfully'})
        
        return Response(
            {'error': 'Order cannot be cancelled in current status'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=False, methods=['get'])
    def seller_orders(self, request):
        """Get orders for seller's books"""
        if not request.user.is_seller:
            return Response({'error': 'Seller account required'}, status=status.HTTP_403_FORBIDDEN)
        
        orders = Order.objects.filter(items__book__seller=request.user).distinct()
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def buyer_orders(self, request):
        """Get orders for the current buyer"""
        if request.user.is_seller:
            return Response({'error': 'Buyer account required'}, status=status.HTTP_403_FORBIDDEN)
        
        orders = Order.objects.filter(buyer=request.user)
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def seller_payments(self, request):
        """Get payment data for seller's orders"""
        if not request.user.is_seller:
            return Response({'error': 'Seller account required'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get all orders for seller's books
        seller_orders = Order.objects.filter(items__book__seller=request.user).distinct()
        
        payments_data = []
        for order in seller_orders:
            payments_data.append({
                'id': order.id,
                'order_id': order.id,
                'amount': float(order.total_amount),
                'payment_method': order.payment_method,
                'status': order.payment_status,
                'created_at': order.created_at,
                'paid_at': order.updated_at if order.payment_status == 'completed' else None,
                'customer_name': order.customer_name,
                'customer_email': order.customer_email,
                'order_status': order.status,
            })
        
        return Response(payments_data)

    @action(detail=False, methods=['get'])
    def seller_customers(self, request):
        """Get customer data for seller's orders"""
        if not request.user.is_seller:
            return Response({'error': 'Seller account required'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get all orders for seller's books
        seller_orders = Order.objects.filter(items__book__seller=request.user).distinct()
        
        # Group by customer
        customers_data = {}
        for order in seller_orders:
            customer_key = order.customer_email
            
            if customer_key not in customers_data:
                customers_data[customer_key] = {
                    'id': customer_key,
                    'name': order.customer_name,
                    'email': order.customer_email,
                    'phone': order.customer_phone,
                    'total_orders': 0,
                    'total_spent': 0,
                    'first_order_date': order.created_at,
                    'last_order_date': order.created_at,
                    'order_history': []
                }
            
            customer = customers_data[customer_key]
            customer['total_orders'] += 1
            customer['total_spent'] += float(order.total_amount)
            
            if order.created_at < customer['first_order_date']:
                customer['first_order_date'] = order.created_at
            if order.created_at > customer['last_order_date']:
                customer['last_order_date'] = order.created_at
            
            # Add order to history
            customer['order_history'].append({
                'id': order.id,
                'total_amount': float(order.total_amount),
                'status': order.status,
                'created_at': order.created_at,
                'items': [
                    {
                        'book_title': item.book.title,
                        'quantity': item.quantity,
                        'price': float(item.price)
                    } for item in order.items.all()
                ]
            })
        
        # Calculate average order value and favorite categories
        for customer in customers_data.values():
            customer['average_order_value'] = customer['total_spent'] / customer['total_orders']
            
            # Get favorite categories from order history
            categories = {}
            for order in customer['order_history']:
                for item in order['items']:
                    # This would need to be enhanced with actual category data
                    categories['Books'] = categories.get('Books', 0) + 1
            
            customer['favorite_categories'] = list(categories.keys())[:3]
        
        return Response(list(customers_data.values()))
