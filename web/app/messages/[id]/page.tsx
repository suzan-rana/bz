'use client';

import { useParams, useRouter } from 'next/navigation';
import RealTimeChat from '@/components/RealTimeChat';
import MessagesSidebar from '@/components/MessagesSidebar';

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const handleBack = () => {
    router.push('/messages');
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-background overflow-hidden">
      <div className="flex h-full">
        {/* Sidebar - Conversation List */}
        <MessagesSidebar />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <RealTimeChat
            conversationId={conversationId}
            onBack={handleBack}
          />
        </div>
      </div>
    </div>
  );
}
