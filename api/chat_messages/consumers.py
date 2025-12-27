import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Conversation, Message
from books.models import Book

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """Handle WebSocket connection"""
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'
        
        # Check if user is authenticated
        if not self.scope['user'].is_authenticated:
            await self.close()
            return
        
        # Check if user is part of the conversation
        if not await self.is_user_in_conversation():
            await self.close()
            return
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to chat room'
        }))

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type', 'chat_message')
        
        if message_type == 'chat_message':
            content = text_data_json.get('content', '')
            book_id = text_data_json.get('book_id')
            
            if content.strip():
                # Save message to database
                message = await self.save_message(content, book_id)
                
                # Send message to room group
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': {
                            'id': str(message.id),
                            'content': message.content,
                            'sender_id': str(message.sender.id),
                            'sender_name': f"{message.sender.first_name} {message.sender.last_name}",
                            'sender_first_name': message.sender.first_name,
                            'sender_last_name': message.sender.last_name,
                            'sender_email': message.sender.email,
                            'book_id': str(message.book.id) if message.book else None,
                            'book_title': message.book.title if message.book else None,
                            'created_at': message.created_at.isoformat(),
                            'is_read': message.is_read
                        }
                    }
                )
        
        elif message_type == 'typing':
            # Handle typing indicator
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_typing',
                    'user_id': str(self.scope['user'].id),
                    'user_name': f"{self.scope['user'].first_name} {self.scope['user'].last_name}"
                }
            )
        
        elif message_type == 'mark_read':
            # Mark messages as read
            await self.mark_messages_as_read()

    async def chat_message(self, event):
        """Send chat message to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message']
        }))

    async def user_typing(self, event):
        """Send typing indicator to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'user_typing',
            'user_id': event['user_id'],
            'user_name': event['user_name']
        }))

    async def user_stop_typing(self, event):
        """Send stop typing indicator to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'user_stop_typing',
            'user_id': event['user_id']
        }))

    @database_sync_to_async
    def is_user_in_conversation(self):
        """Check if user is part of the conversation"""
        try:
            conversation = Conversation.objects.get(id=self.conversation_id)
            return self.scope['user'] in [conversation.buyer, conversation.seller]
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, content, book_id=None):
        """Save message to database"""
        conversation = Conversation.objects.get(id=self.conversation_id)
        
        # Get book reference if provided
        book = None
        if book_id:
            try:
                book = Book.objects.get(id=book_id)
            except Book.DoesNotExist:
                pass
        
        message = Message.objects.create(
            conversation=conversation,
            sender=self.scope['user'],
            book=book,
            content=content
        )
        
        # Update conversation timestamp
        conversation.save()
        
        return message

    @database_sync_to_async
    def mark_messages_as_read(self):
        """Mark all unread messages from other user as read"""
        conversation = Conversation.objects.get(id=self.conversation_id)
        conversation.messages.filter(
            is_read=False
        ).exclude(
            sender=self.scope['user']
        ).update(is_read=True)
