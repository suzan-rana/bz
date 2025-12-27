from django.db import models
import uuid

class Order(models.Model):
    """Order model for purchases"""
    STATUS_CHOICES = [
        ('pending', 'Pending - Order placed, waiting for payment'),
        ('paid', 'Paid - Payment received, ready to process'),
        ('processing', 'Processing - Order being prepared for shipping'),
        ('shipped', 'Shipped - Order has been sent to customer'),
        ('delivered', 'Delivered - Order received by customer'),
        ('cancelled', 'Cancelled - Order has been cancelled'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('khalti', 'Khalti'),
        ('cod', 'Cash on Delivery'),
    ]

    id = models.AutoField(primary_key=True)
    buyer = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='orders')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='khalti')
    shipping_address = models.TextField()
    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=20)
    khalti_payment_id = models.CharField(max_length=100, blank=True, null=True)
    khalti_transaction_id = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id} by {self.buyer.email}"

class OrderItem(models.Model):
    """Individual items in an order"""
    id = models.AutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    book = models.ForeignKey('books.Book', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.quantity}x {self.book.title} in Order {self.order.id}"
