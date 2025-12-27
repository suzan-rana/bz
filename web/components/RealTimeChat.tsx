'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Send, Wifi, WifiOff, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { messagesAPI } from '@/lib/api';
import { getDefaultAvatar, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_email: string;
  sender_first_name?: string;
  sender_last_name?: string;
  book_id?: string;
  book_title?: string;
  created_at: string;
  is_read: boolean;
}

interface Conversation {
  id: string;
  buyer: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  seller: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  messages: Message[];
  recent_books: Array<{
    book__id: string;
    book__title: string;
    book__cover_image?: string;
  }>;
  created_at: string;
  updated_at: string;
}

interface RealTimeChatProps {
  conversationId: string;
  onBack?: () => void;
}

export default function RealTimeChat({ conversationId, onBack }: RealTimeChatProps) {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  console.log('RealTimeChat props:', { conversationId, user: user?.email });

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Initialize WebSocket connection and fetch conversation
  useEffect(() => {
    console.log('useEffect triggered:', { conversationId, user: user?.email, hasToken: !!localStorage.getItem('authToken') });
    if (conversationId && user) {
      // Fetch conversation immediately
      fetchConversation();
      // Then try to initialize WebSocket
      initializeWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [conversationId, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeWebSocket = async () => {
    try {
      // Get WebSocket URL from API
      const response = await messagesAPI.getWebSocketUrl(conversationId);
      const wsUrl = response.data.websocket_url;

      // Create WebSocket connection
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (conversationId && user) {
            initializeWebSocket();
          }
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Error initializing WebSocket:', error);
      toast.error('Failed to connect to chat');
    }
  };

  const handleWebSocketMessage = (data: any) => {
    console.log('WebSocket message received:', data);
    switch (data.type) {
      case 'connection_established':
        console.log('Connection established:', data.message);
        break;

      case 'chat_message':
        const newMsg = data.message;
        console.log('New message received:', newMsg);
        setMessages(prev => [...prev, newMsg]);
        // Mark message as read if it's from other user
        if (newMsg.sender_id !== user?.id) {
          markAsRead();
        }
        break;

      case 'user_typing':
        setTypingUsers(prev => {
          if (!prev.includes(data.user_name)) {
            return [...prev, data.user_name];
          }
          return prev;
        });
        break;

      case 'user_stop_typing':
        setTypingUsers(prev => prev.filter(name => name !== data.user_name));
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const fetchConversation = async () => {
    console.log('fetchConversation called with conversationId:', conversationId);
    try {
      setLoading(true);
      console.log('Fetching conversation:', conversationId);
      const response = await messagesAPI.getConversation(conversationId);
      console.log('Conversation response:', response.data);
      const conv = response.data;
      setConversation(conv);
      console.log('Setting messages:', conv.messages);
      setMessages(conv.messages);

      // Mark messages as read
      await messagesAPI.markAsRead(conversationId);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      console.error('Error details:', error instanceof Error ? error.message : error);
      toast.error('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      return;
    }

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      // Always send via REST API for reliability
      const response = await messagesAPI.sendMessage(conversationId, {
        content: messageContent
      });

      // Add the new message to the local state
      const newMsg = response.data;
      setMessages(prev => [...prev, newMsg]);

      // Also try WebSocket if available for real-time
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'chat_message',
          content: messageContent
        }));
      }

      // Clear typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      // Restore the message if sending failed
      setNewMessage(messageContent);
    } finally {
      setSending(false);
      // Focus the input after sending
      inputRef.current?.focus();
    }
  };

  const handleTyping = useCallback(() => {
    // Only send typing indicator if WebSocket is available
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing'
      }));
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'stop_typing'
        }));
      }
    }, 2000);
  }, []);

  const markAsRead = async () => {
    try {
      await messagesAPI.markAsRead(conversationId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const getOtherUser = () => {
    if (!conversation) return null;
    return user?.id === conversation.buyer.id ? conversation.seller : conversation.buyer;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderUserAvatar = (message: Message) => {
    const initials = getInitials(message.sender_first_name || '', message.sender_last_name || '');
    const defaultAvatarUrl = getDefaultAvatar(message.sender_name, message.sender_email);

    return (
      <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center">
        <img
          src={defaultAvatarUrl}
          alt={message.sender_name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div class="w-full h-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  ${initials || 'U'}
                </div>
              `;
            }
          }}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading conversation...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!conversation) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">
            <p>Conversation not found</p>
            {onBack && (
              <Button onClick={onBack} className="mt-4">
                Go Back
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const otherUser = getOtherUser();

  return (
    <div className="flex flex-col h-full">
      {/* Header - Fixed */}
      <div className="border-b p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {otherUser && (
                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                  <img
                    src={getDefaultAvatar(`${otherUser.first_name} ${otherUser.last_name}`, otherUser.email)}
                    alt={`${otherUser.first_name} ${otherUser.last_name}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="w-full h-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                            ${getInitials(otherUser.first_name, otherUser.last_name)}
                          </div>
                        `;
                      }
                    }}
                  />
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold">
                  {otherUser ? `${otherUser.first_name} ${otherUser.last_name}` : 'Chat'}
                </h2>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender_id !== user?.id && (
              <div className="flex-shrink-0">
                {renderUserAvatar(msg)}
              </div>
            )}
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.sender_id === user?.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground'
                }`}
            >
              <p className="text-sm">{msg.content}</p>
              <div className="flex items-center justify-between mt-1 text-xs opacity-75">
                <span>{formatTime(msg.created_at)}</span>
                {msg.sender_id === user?.id && (
                  <span>{msg.is_read ? '✓✓' : '✓'}</span>
                )}
              </div>
            </div>
            {msg.sender_id === user?.id && (
              <div className="flex-shrink-0">
                {renderUserAvatar(msg)}
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-muted text-foreground px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm">{typingUsers.join(', ')} typing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="border-t border-muted/30 p-4 flex-shrink-0">
        <div className="flex space-x-3">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type your message..."
            disabled={sending}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
