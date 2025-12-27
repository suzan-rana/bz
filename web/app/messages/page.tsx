'use client';

import MessagesSidebar from '@/components/MessagesSidebar';
import { MessageCircle } from 'lucide-react';

export default function MessagesPage() {
    return (
        <div className="h-[calc(100vh-64px)] bg-background overflow-hidden">
            <div className="flex h-full">
                {/* Sidebar - Conversation List */}
                <MessagesSidebar />

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 flex items-center justify-center bg-muted/20">
                        <div className="text-center">
                            <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                            <h2 className="text-xl font-semibold text-foreground mb-2">Select a conversation</h2>
                            <p className="text-muted-foreground">Choose a conversation from the sidebar to start chatting</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
