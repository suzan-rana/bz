'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { messagesAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { MessageCircle, Search } from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import { getDefaultAvatar, getInitials } from '@/lib/utils';

interface Conversation {
    id: string;
    recent_books: Array<{
        book__id: string;
        book__title: string;
        book__cover_image?: string;
    }>;
    other_user: {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
    };
    unread_count: number;
    last_message?: {
        content: string;
        sender: string;
        created_at: string;
    };
    updated_at: string;
    is_active: boolean;
}

export default function MessagesSidebar() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useAuth();
    const params = useParams();
    const pathname = usePathname();
    const currentConversationId = params.id as string;

    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const response = await messagesAPI.getConversations();
            setConversations(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching conversations:', error);
            toast.error('Failed to load conversations');
        } finally {
            setLoading(false);
        }
    };

    const filteredConversations = conversations.filter(conversation =>
        conversation.other_user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conversation.other_user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conversation.other_user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else if (diffInHours < 168) {
            return `${Math.floor(diffInHours / 24)}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const renderUserAvatar = (user: { first_name: string; last_name: string; email: string }) => {
        const initials = getInitials(user.first_name, user.last_name);
        const defaultAvatarUrl = getDefaultAvatar(`${user.first_name} ${user.last_name}`, user.email);

        return (
            <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                <img
                    src={defaultAvatarUrl}
                    alt={`${user.first_name} ${user.last_name}`}
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
            <div className="w-80 border-r border-border bg-card flex flex-col h-full">
                <div className="p-4 border-b border-border flex-shrink-0">
                    <h1 className="text-xl font-semibold text-foreground">Messages</h1>
                    <p className="text-sm text-muted-foreground">Chat with people</p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-80 border-r border-border bg-card flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-border flex-shrink-0">
                <h1 className="text-xl font-semibold text-foreground">Messages</h1>
                <p className="text-sm text-muted-foreground">Chat with people</p>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-border flex-shrink-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length > 0 ? (
                    <div>
                        {filteredConversations.map((conversation) => (
                            <Link key={conversation.id} href={`/messages/${conversation.id}`}>
                                <div className={`flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors border-b border-border/50 cursor-pointer ${currentConversationId === conversation.id
                                        ? 'bg-primary/10 border-l-4 border-l-primary'
                                        : ''
                                    }`}>
                                    {/* User Avatar */}
                                    <div className="relative">
                                        {renderUserAvatar(conversation.other_user)}
                                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                                    </div>

                                    {/* Conversation Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-medium text-foreground truncate">
                                                {conversation.other_user.first_name} {conversation.other_user.last_name}
                                            </h3>
                                            <span className="text-xs text-muted-foreground">
                                                {formatTime(conversation.updated_at)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-sm text-muted-foreground truncate">
                                                {conversation.last_message ? (
                                                    conversation.last_message.sender === user?.email ? 'You: ' : `${conversation.other_user.first_name}: `
                                                ) + conversation.last_message.content : 'No messages yet'}
                                            </p>
                                            {conversation.unread_count > 0 && (
                                                <div className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-medium min-w-[20px] text-center">
                                                    {conversation.unread_count}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">
                            {searchTerm ? 'No conversations found' : 'No conversations yet'}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {searchTerm ? 'Try adjusting your search terms' : 'Start a conversation with someone'}
                        </p>
                        {!searchTerm && (
                            <Button asChild size="sm">
                                <Link href="/books">Browse Books</Link>
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
