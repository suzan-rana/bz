from rest_framework import serializers
from .models import Conversation, Message
from books.serializers import BookSerializer
from users.serializers import UserSerializer


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    book = BookSerializer(read_only=True)
    sender_id = serializers.SerializerMethodField()
    sender_name = serializers.SerializerMethodField()
    sender_email = serializers.SerializerMethodField()
    sender_first_name = serializers.SerializerMethodField()
    sender_last_name = serializers.SerializerMethodField()
    book_id = serializers.SerializerMethodField()
    book_title = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "id", 
            "sender", 
            "sender_id",
            "sender_name", 
            "sender_email",
            "sender_first_name",
            "sender_last_name",
            "book", 
            "book_id",
            "book_title",
            "content", 
            "is_read", 
            "created_at"
        ]
        read_only_fields = ["sender", "is_read", "created_at"]

    def get_sender_id(self, obj):
        return str(obj.sender.id)

    def get_sender_name(self, obj):
        return f"{obj.sender.first_name} {obj.sender.last_name}"

    def get_sender_email(self, obj):
        return obj.sender.email

    def get_sender_first_name(self, obj):
        return obj.sender.first_name

    def get_sender_last_name(self, obj):
        return obj.sender.last_name

    def get_book_id(self, obj):
        return str(obj.book.id) if obj.book else None

    def get_book_title(self, obj):
        return obj.book.title if obj.book else None


class ConversationSerializer(serializers.ModelSerializer):
    buyer = UserSerializer(read_only=True)
    seller = UserSerializer(read_only=True)
    messages = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    recent_books = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "buyer",
            "seller",
            "messages",
            "unread_count",
            "last_message",
            "recent_books",
            "created_at",
            "updated_at",
            "is_active",
        ]
        read_only_fields = ["buyer", "seller", "created_at", "updated_at"]

    def get_messages(self, obj):
        """Get messages ordered by creation date"""
        messages = obj.messages.all().order_by('created_at')
        return MessageSerializer(messages, many=True, context=self.context).data

    def get_recent_books(self, obj):
        """Get recent books discussed in this conversation"""
        books = (
            obj.messages.filter(book__isnull=False)
            .values("book__id", "book__title", "book__cover_image")
            .distinct()[:5]
        )
        return list(books)

    def get_unread_count(self, obj):
        user = self.context["request"].user
        return obj.messages.filter(is_read=False).exclude(sender=user).count()

    def get_last_message(self, obj):
        last_message = obj.messages.last()
        if last_message:
            return {
                "content": (
                    last_message.content[:100] + "..."
                    if len(last_message.content) > 100
                    else last_message.content
                ),
                "sender": last_message.sender.email,
                "created_at": last_message.created_at,
            }
        return None


class ConversationListSerializer(serializers.ModelSerializer):
    other_user = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    recent_books = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "other_user",
            "unread_count",
            "last_message",
            "recent_books",
            "updated_at",
            "is_active",
        ]

    def get_other_user(self, obj):
        user = self.context["request"].user
        other_user = obj.seller if user == obj.buyer else obj.buyer
        return {
            "id": other_user.id,
            "email": other_user.email,
            "first_name": other_user.first_name,
            "last_name": other_user.last_name,
        }

    def get_recent_books(self, obj):
        """Get recent books discussed in this conversation"""
        books = (
            obj.messages.filter(book__isnull=False)
            .values("book__id", "book__title", "book__cover_image")
            .distinct()[:5]
        )
        return list(books)

    def get_unread_count(self, obj):
        user = self.context["request"].user
        return obj.messages.filter(is_read=False).exclude(sender=user).count()

    def get_last_message(self, obj):
        last_message = obj.messages.last()
        if last_message:
            return {
                "content": (
                    last_message.content[:100] + "..."
                    if len(last_message.content) > 100
                    else last_message.content
                ),
                "sender": last_message.sender.email,
                "created_at": last_message.created_at,
            }
        return None
