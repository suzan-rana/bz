from rest_framework import serializers
from .models import Order, OrderItem
from users.serializers import UserSerializer
from books.serializers import BookSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'book', 'quantity', 'price', 'created_at']

class OrderSerializer(serializers.ModelSerializer):
    buyer = UserSerializer(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'buyer', 'total_amount', 'status', 'payment_status', 'payment_method',
            'shipping_address', 'customer_name', 'customer_email', 'customer_phone',
            'khalti_payment_id', 'khalti_transaction_id', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class OrderCreateSerializer(serializers.ModelSerializer):
    items = serializers.ListField(child=serializers.DictField(), write_only=True)

    class Meta:
        model = Order
        fields = [
            'shipping_address', 'customer_name', 'customer_email', 'customer_phone',
            'payment_method', 'items'
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        validated_data['buyer'] = self.context['request'].user
        validated_data['total_amount'] = 0
        
        # Set default payment status based on payment method
        if validated_data.get('payment_method') == 'cod':
            validated_data['payment_status'] = 'pending'
        else:
            validated_data['payment_status'] = 'pending'
        
        order = Order.objects.create(**validated_data)
        
        for item_data in items_data:
            from books.models import Book
            book = Book.objects.get(id=item_data['book'])
            quantity = item_data.get('quantity', 1)
            price = item_data.get('price', book.price)
            
            OrderItem.objects.create(
                order=order,
                book=book,
                quantity=quantity,
                price=price
            )
            
            validated_data['total_amount'] += price * quantity
        
        order.total_amount = validated_data['total_amount']
        order.save()
        
        return order
