'use client';

import { useEffect, useState } from 'react';
import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { MoreVertical, User } from 'lucide-react';
import { Avatar } from '@/components/ui/display/avatar';
import { Input } from '@/components/ui/form/input';
import { Skeleton } from '@/components/ui/feedback/skeleton';
import { Button } from '@/components/ui/form/button';
import { useIsAuthenticated } from '@/lib/auth/use-is-authenticated';
import { useRealtime } from '@/lib/realtime/realtime-provider';
import { getLastSeen, markConversationSeen } from '@/lib/chat/last-seen';
import { ME_QUERY } from '@/lib/graphql/queries/me';
import {
  ACCEPT_CONVERSATION_MUTATION,
  CONVERSATIONS_QUERY,
  DECLINE_CONVERSATION_MUTATION,
  PENDING_CONVERSATIONS_QUERY,
  SEND_MESSAGE_MUTATION,
  type ChatMessage,
  type Conversation,
} from '@/lib/graphql/queries/chat';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { ConversationItem } from '@/components/chat/ConversationItem';
import { ConversationRequestItem } from '@/components/chat/ConversationRequestItem';
import { PendingConversationBar } from '@/components/chat/PendingConversationBar';
import { ProfilePanel } from '@/components/chat/ProfilePanel';
import { OptionsPanel } from '@/components/chat/OptionsPanel';

type SidePanel = 'profile' | 'options' | null;

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) return 'now';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  return `${Math.floor(diffHours / 24)}d`;
}

function getOtherParticipant(conversation: Conversation, myId: string) {
  return conversation.userOne.id === myId ? conversation.userTwo : conversation.userOne;
}

function isConversationUnread(conversation: Conversation, myId: string): boolean {
  const lastMessage = conversation.messages.at(-1);
  if (!lastMessage || lastMessage.senderId === myId) return false;
  const lastSeen = getLastSeen(conversation.id);
  return !lastSeen || new Date(lastMessage.createdAt) > new Date(lastSeen);
}

export default function ChatPage() {
  const isAuthenticated = useIsAuthenticated();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidePanel, setSidePanel] = useState<SidePanel>(null);

  const { data: meData } = useQuery(ME_QUERY, { skip: !isAuthenticated });
  const {
    data: conversationsData,
    loading,
    error,
    refetch,
  } = useQuery(CONVERSATIONS_QUERY, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });
  const { data: pendingData, refetch: refetchPending } = useQuery(PENDING_CONVERSATIONS_QUERY, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });
  const [sendMessage] = useMutation(SEND_MESSAGE_MUTATION);
  const [acceptConversation] = useMutation(ACCEPT_CONVERSATION_MUTATION);
  const [declineConversation] = useMutation(DECLINE_CONVERSATION_MUTATION);
  const client = useApolloClient();
  const { on, joinConversation, leaveConversation } = useRealtime();

  const myId = meData?.me.id;
  const pendingConversations = pendingData?.pendingConversations ?? [];
  const conversations = conversationsData?.conversations ?? [];
  const allConversations = [...conversations, ...pendingConversations];
  const effectiveActiveId = activeConversationId ?? conversations[0]?.id ?? null;

  const activeConversation = allConversations.find((c) => c.id === effectiveActiveId);
  const conversationIds = allConversations.map((c) => c.id).join(',');

  useEffect(() => {
    if (!conversationIds) return;
    const ids = conversationIds.split(',');
    for (const id of ids) joinConversation(id);
    return () => {
      for (const id of ids) leaveConversation(id);
    };
  }, [conversationIds, joinConversation, leaveConversation]);

  useEffect(() => {
    return on('newMessage', (...args) => {
      const payload = args[0] as { conversationId: string; message: ChatMessage };

      client.cache.updateQuery({ query: CONVERSATIONS_QUERY }, (data) => {
        if (!data) return data;
        return {
          conversations: data.conversations.map((conversation) => {
            if (conversation.id !== payload.conversationId) return conversation;
            const alreadyPresent = conversation.messages.some((m) => m.id === payload.message.id);
            if (alreadyPresent) return conversation;
            return { ...conversation, messages: [...conversation.messages, payload.message] };
          }),
        };
      });
    });
  }, [on, client]);

  useEffect(() => {
    if (effectiveActiveId) markConversationSeen(effectiveActiveId);
  }, [effectiveActiveId]);

  useEffect(() => {
    return on('conversationStatusChanged', () => {
      refetch();
      refetchPending();
    });
  }, [on, refetch, refetchPending]);

  const handleAccept = async (conversationId: string) => {
    await acceptConversation({ variables: { input: { conversationId } } });
    await refetch();
    await refetchPending();
  };

  const handleDecline = async (conversationId: string) => {
    await declineConversation({ variables: { input: { conversationId } } });
    await refetch();
    await refetchPending();
  };

  const handleSend = async (content: string) => {
    if (!effectiveActiveId) return;
    await sendMessage({
      variables: { input: { conversationId: effectiveActiveId, content } },
    });
    await refetch();
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="flex h-[calc(100vh_-_64px)] w-full items-center justify-center bg-card">
        <Skeleton className="h-96 w-full max-w-4xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh_-_64px)] w-full flex-col items-center justify-center gap-4 bg-card">
        <p className="text-text-secondary text-xs">Failed to load conversations</p>
        <Button onClick={() => refetch()} className="px-6 py-3">
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div
      className="flex h-[calc(100vh_-_64px)] w-full bg-card"
      style={{ fontFamily: 'var(--font-family-jost)' }}
    >
      <div className="flex w-80 shrink-0 flex-col border-r border-border-default">
        <div className="flex flex-col gap-3 p-4">
          <h1
            className="text-[22px] leading-[1.3] text-text-primary"
            style={{ fontFamily: 'var(--font-family-cormorant)' }}
          >
            Messages
          </h1>
          <Input placeholder="Search..." />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {myId && pendingConversations.length > 0 && (
            <div className="border-b border-border-default pb-2">
              <span className="block px-4 py-2 text-[9px] leading-[1.5] font-medium tracking-[0.06em] text-text-muted uppercase">
                Requests
              </span>
              {pendingConversations.map((conversation) => {
                const other = getOtherParticipant(conversation, myId);
                return (
                  <ConversationRequestItem
                    key={conversation.id}
                    name={other.name}
                    onClick={() => {
                      setActiveConversationId(conversation.id);
                      setSidePanel(null);
                    }}
                    onAccept={() => handleAccept(conversation.id)}
                    onDecline={() => handleDecline(conversation.id)}
                  />
                );
              })}
            </div>
          )}

          {conversations.length === 0 && (
            <p className="text-body-sm text-text-muted p-4">No conversations yet.</p>
          )}
          {myId &&
            conversations.map((conversation) => {
              const other = getOtherParticipant(conversation, myId);
              const lastMessage = conversation.messages.at(-1);

              return (
                <ConversationItem
                  key={conversation.id}
                  name={other.name}
                  lastMessage={lastMessage?.content ?? 'No messages yet'}
                  timeLabel={lastMessage ? formatRelativeTime(new Date(lastMessage.createdAt)) : ''}
                  unreadCount={isConversationUnread(conversation, myId) ? 1 : 0}
                  isActive={conversation.id === effectiveActiveId}
                  onClick={() => {
                    setActiveConversationId(conversation.id);
                    markConversationSeen(conversation.id);
                    setSidePanel(null);
                  }}
                />
              );
            })}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {activeConversation && myId && (
          <>
            {(() => {
              const other = getOtherParticipant(activeConversation, myId);
              return (
                <div className="flex items-center justify-between border-b border-border-default p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={other.name} size="sm" />
                    <span className="text-xs leading-[1.8] font-medium text-text-primary">
                      {other.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-text-secondary">
                    <button
                      type="button"
                      aria-label="View profile"
                      onClick={() =>
                        setSidePanel((prev) => (prev === 'profile' ? null : 'profile'))
                      }
                      className={
                        sidePanel === 'profile' ? 'text-text-primary' : 'hover:text-text-primary'
                      }
                    >
                      <User className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Options"
                      onClick={() =>
                        setSidePanel((prev) => (prev === 'options' ? null : 'options'))
                      }
                      className={
                        sidePanel === 'options' ? 'text-text-primary' : 'hover:text-text-primary'
                      }
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              );
            })()}

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
              {activeConversation.messages.map((message) => {
                const isOwn = message.senderId === myId;
                const other = getOtherParticipant(activeConversation, myId);

                return (
                  <ChatBubble
                    key={message.id}
                    content={message.content}
                    isOwn={isOwn}
                    createdAt={new Date(message.createdAt)}
                    senderName={isOwn ? meData!.me.name : other.name}
                  />
                );
              })}
            </div>

            {activeConversation.status === 'PENDING' ? (
              <PendingConversationBar
                isInitiator={activeConversation.initiatorId === myId}
                otherName={getOtherParticipant(activeConversation, myId).name}
                onAccept={() => handleAccept(activeConversation.id)}
                onDecline={() => handleDecline(activeConversation.id)}
              />
            ) : (
              <ChatComposer onSend={handleSend} />
            )}
          </>
        )}
      </div>

      {activeConversation &&
        myId &&
        sidePanel &&
        (() => {
          const other = getOtherParticipant(activeConversation, myId);
          return sidePanel === 'profile' ? (
            <ProfilePanel name={other.name} onClose={() => setSidePanel(null)} />
          ) : (
            <OptionsPanel onClose={() => setSidePanel(null)} />
          );
        })()}
    </div>
  );
}
