from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Conversation, Message
from .serializers import ConversationSerializer, ConversationListSerializer, MessageSerializer
from books.models import Book

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        print(f"Getting conversations for user: {user.email}")
        conversations = Conversation.objects.filter(
            Q(buyer=user) | Q(seller=user),
            is_active=True
        )
        print(f"Found {conversations.count()} conversations")
        return conversations

    def get_serializer_class(self):
        if self.action == 'list':
            return ConversationListSerializer
        return ConversationSerializer

    def retrieve(self, request, *args, **kwargs):
        print(f"Retrieving conversation with pk: {kwargs.get('pk')}")
        instance = self.get_object()
        print(f"Found conversation: {instance.id} between {instance.buyer.email} and {instance.seller.email}")
        print(f"Messages count: {instance.messages.count()}")
        serializer = self.get_serializer(instance)
        print(f"Serialized data keys: {list(serializer.data.keys())}")
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def start_conversation(self, request):
        """Start a new conversation or get existing one between buyer and seller"""
        print(f"Starting conversation with data: {request.data}")
        book_id = request.data.get('book_id')
        seller_id = request.data.get('seller_id')
        buyer_id = request.data.get('buyer_id')  # For sellers messaging buyers
        
        if not book_id:
            print(f"Missing required field: book_id={book_id}")
            return Response(
                {'error': 'book_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            book = Book.objects.get(id=book_id)
            
            # Determine if current user is buyer or seller
            if request.user.is_seller and buyer_id:
                # Seller messaging buyer
                from users.models import User
                try:
                    buyer = User.objects.get(id=buyer_id)
                    seller = request.user
                except User.DoesNotExist:
                    return Response(
                        {'error': 'Buyer not found'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                # Buyer messaging seller (original flow)
                if not seller_id:
                    return Response(
                        {'error': 'seller_id is required for buyers'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                seller = book.seller
                buyer = request.user
            
            print(f"Found book: {book.title}, seller: {seller.email}, buyer: {buyer.email}")
            
            # Check if conversation already exists between buyer and seller
            conversation, created = Conversation.objects.get_or_create(
                buyer=buyer,
                seller=seller,
                defaults={'is_active': True}
            )

            print(f"Conversation {'created' if created else 'already exists'}: {conversation.id}")

            # Create initial message if provided
            initial_message = request.data.get('message')
            if initial_message:
                message = Message.objects.create(
                    conversation=conversation,
                    sender=request.user,
                    book=book,  # Reference the book in the message
                    content=initial_message
                )
                print(f"Created initial message: {message.id} about book: {book.title}")

            serializer = self.get_serializer(conversation)
            response_data = serializer.data
            print(f"Returning conversation: {response_data}")
            return Response(response_data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

        except Book.DoesNotExist:
            print(f"Book not found with id: {book_id}")
            return Response(
                {'error': 'Book not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Send a message in a conversation"""
        conversation = self.get_object()
        content = request.data.get('content')
        book_id = request.data.get('book_id')  # Optional book reference
        
        if not content:
            return Response(
                {'error': 'Message content is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user is part of the conversation
        if request.user not in [conversation.buyer, conversation.seller]:
            return Response(
                {'error': 'You are not part of this conversation'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # Get book reference if provided
        book = None
        if book_id:
            try:
                book = Book.objects.get(id=book_id)
            except Book.DoesNotExist:
                pass  # Book reference is optional

        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            book=book,  # Can be None if no book reference
            content=content
        )

        # Update conversation timestamp
        conversation.save()

        serializer = MessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark all messages in conversation as read"""
        conversation = self.get_object()
        
        # Mark all unread messages from other user as read
        conversation.messages.filter(
            is_read=False
        ).exclude(
            sender=request.user
        ).update(is_read=True)

        return Response({'status': 'Messages marked as read'})

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive a conversation"""
        conversation = self.get_object()
        conversation.is_active = False
        conversation.save()
        return Response({'status': 'Conversation archived'})

    @action(detail=True, methods=['get'])
    def websocket_url(self, request, pk=None):
        """Get WebSocket connection URL for real-time chat"""
        conversation = self.get_object()
        
        # Check if user is part of the conversation
        if request.user not in [conversation.buyer, conversation.seller]:
            return Response(
                {'error': 'You are not part of this conversation'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get the access token from the request
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        else:
            return Response(
                {'error': 'No valid token provided'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Construct WebSocket URL
        # Use the same host as the request
        host = request.get_host()
        protocol = 'wss' if request.is_secure() else 'ws'
        ws_url = f"{protocol}://{host}/ws/chat/{conversation.id}/?token={token}"
        
        return Response({
            'websocket_url': ws_url,
            'conversation_id': str(conversation.id)
        })

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(
            conversation__in=Conversation.objects.filter(
                Q(buyer=user) | Q(seller=user)
            )
        )

    def perform_create(self, serializer):
        conversation_id = self.request.data.get('conversation_id')
        conversation = Conversation.objects.get(id=conversation_id)
        
        # Check if user is part of the conversation
        if self.request.user not in [conversation.buyer, conversation.seller]:
            raise permissions.PermissionDenied("You are not part of this conversation")
        
        serializer.save(sender=self.request.user, conversation=conversation)
        
        # Update conversation timestamp
        conversation.save()
