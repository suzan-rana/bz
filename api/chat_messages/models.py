from django.db import models
from django.contrib.auth import get_user_model
from books.models import Book

User = get_user_model()

class Conversation(models.Model):
    """Represents a conversation between a buyer and seller"""
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='buyer_conversations')
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='seller_conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['buyer', 'seller']
        ordering = ['-updated_at']

    def __str__(self):
        return f"Conversation between {self.buyer.email} and {self.seller.email}"

class Message(models.Model):
    """Represents a single message in a conversation"""
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='messages', null=True, blank=True)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        book_ref = f" about {self.book.title}" if self.book else ""
        return f"Message from {self.sender.email}{book_ref} at {self.created_at}"
