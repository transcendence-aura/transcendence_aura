'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { Plus, User } from 'lucide-react';
import { Avatar } from '@/components/ui/display/avatar';
import { Skeleton } from '@/components/ui/feedback/skeleton';
import { Button } from '@/components/ui/form/button';
import { Dialog } from '@/components/ui/overlay/dialog';
import { ProfileContent } from '@/components/profile/ProfileContent';
import { useIsAuthenticated } from '@/lib/auth/use-is-authenticated';
import { useRealtime } from '@/lib/realtime/realtime-provider';
import { useToast } from '@/components/ui/feedback/toast';
import { getLastSeen, markConversationSeen } from '@/lib/chat/last-seen';
import { formatRelativeTime } from '@/lib/format-relative-time';
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
import { NewConversationDialog } from '@/components/chat/NewConversationDialog';
import { PendingConversationBar } from '@/components/chat/PendingConversationBar';

function getOtherParticipant(conversation: Conversation, myId: string) {
  return conversation.userOne.id === myId ? conversation.userTwo : conversation.userOne;
}

function isConversationUnread(conversation: Conversation, myId: string): boolean {
  const lastMessage = conversation.messages.at(-1);
  if (!lastMessage || lastMessage.senderId === myId) return false;
  const lastSeen = getLastSeen(conversation.id);
  return !lastSeen || new Date(lastMessage.createdAt) > new Date(lastSeen);
}

// The Community page's Message tab: same messaging UI that used to live at its own /chat route,
// now bounded to a fixed height so it sits inside Community's normal scrolling page (Tabs above,
// Footer below) instead of taking over the full viewport.
export function MessageTab() {
  const isAuthenticated = useIsAuthenticated();
  const searchParams = useSearchParams();
  // Set when the Message button on a profile just started/found a conversation - opens straight
  // into it instead of defaulting to the first one in the list.
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() =>
    searchParams.get('conversationId'),
  );
  const [profileHandle, setProfileHandle] = useState<string | null>(null);
  const [newConversationOpen, setNewConversationOpen] = useState(false);

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
  const {
    data: pendingData,
    error: pendingError,
    refetch: refetchPending,
  } = useQuery(PENDING_CONVERSATIONS_QUERY, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });
  const [sendMessage] = useMutation(SEND_MESSAGE_MUTATION);
  const [acceptConversation] = useMutation(ACCEPT_CONVERSATION_MUTATION);
  const [declineConversation] = useMutation(DECLINE_CONVERSATION_MUTATION);
  const client = useApolloClient();
  const { on, joinConversation, leaveConversation } = useRealtime();
  const { toast } = useToast();

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

      const appendMessage = (list: Conversation[]): Conversation[] =>
        list.map((conversation) => {
          if (conversation.id !== payload.conversationId) return conversation;
          const alreadyPresent = conversation.messages.some((m) => m.id === payload.message.id);
          if (alreadyPresent) return conversation;
          return { ...conversation, messages: [...conversation.messages, payload.message] };
        });

      client.cache.updateQuery({ query: CONVERSATIONS_QUERY }, (data) =>
        data ? { conversations: appendMessage(data.conversations) } : data,
      );
      client.cache.updateQuery({ query: PENDING_CONVERSATIONS_QUERY }, (data) =>
        data ? { pendingConversations: appendMessage(data.pendingConversations) } : data,
      );
    });
  }, [on, client]);

  useEffect(() => {
    if (effectiveActiveId) markConversationSeen(effectiveActiveId);
  }, [effectiveActiveId, activeConversation?.messages.length]);

  useEffect(() => {
    return on('conversationStatusChanged', () => {
      refetch();
      refetchPending();
    });
  }, [on, refetch, refetchPending]);

  useEffect(() => {
    return on('newNotification', () => {
      refetch();
      refetchPending();
    });
  }, [on, refetch, refetchPending]);

  useEffect(() => {
    return on('conversationStarted', () => {
      refetch();
      refetchPending();
    });
  }, [on, refetch, refetchPending]);

  const handleAccept = async (conversationId: string) => {
    try {
      await acceptConversation({ variables: { input: { conversationId } } });
      await refetch();
      await refetchPending();
    } catch {
      toast({ message: 'Could not accept this request, please retry', variant: 'error' });
    }
  };

  const handleDecline = async (conversationId: string) => {
    try {
      await declineConversation({ variables: { input: { conversationId } } });
      await refetch();
      await refetchPending();
    } catch {
      toast({ message: 'Could not decline this request, please retry', variant: 'error' });
    }
  };

  const handleSend = async (content: string) => {
    if (!effectiveActiveId) return;
    try {
      await sendMessage({
        variables: { input: { conversationId: effectiveActiveId, content } },
      });
      await refetch();
    } catch (err) {
      toast({ message: 'Could not send your message, please retry', variant: 'error' });
      throw err;
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="border-border-default flex h-[70vh] min-h-[420px] w-full items-center justify-center border">
        <Skeleton className="h-96 w-full max-w-md" />
      </div>
    );
  }

  if (error && conversations.length === 0) {
    return (
      <div className="border-border-default flex h-[70vh] min-h-[420px] w-full flex-col items-center justify-center gap-4 border">
        <p className="text-text-secondary text-xs">Failed to load conversations</p>
        <Button onClick={() => refetch()} className="px-6 py-3">
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div
      className="border-border-default flex h-[70vh] min-h-[420px] w-full border"
      style={{ fontFamily: 'var(--font-family-jost)' }}
    >
      <div className="border-border-default flex w-80 shrink-0 flex-col border-r">
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <h1
              className="text-[22px] leading-[1.3] text-text-primary"
              style={{ fontFamily: 'var(--font-family-cormorant)' }}
            >
              Messages
            </h1>
            <button
              type="button"
              aria-label="New conversation"
              onClick={() => setNewConversationOpen(true)}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {pendingError && (
            <p className="px-4 py-2 text-[9px] leading-[1.5] tracking-[0.06em] text-status-error">
              Failed to load requests
            </p>
          )}

          {myId && (
            <div className="border-border-default border-b pb-2">
              <span className="block px-4 py-2 text-[9px] leading-[1.5] font-medium tracking-[0.06em] text-text-muted uppercase">
                Requests
              </span>
              {!pendingError && pendingConversations.length === 0 && (
                <p className="text-[11px] italic leading-[1.6] text-text-muted px-4 py-4">
                  No pending requests.
                </p>
              )}
              {pendingConversations.map((conversation) => {
                const other = getOtherParticipant(conversation, myId);
                return (
                  <ConversationRequestItem
                    key={conversation.id}
                    name={other.name}
                    avatarUrl={`/api/v1/users/${other.id}/avatar`}
                    onClick={() => {
                      setActiveConversationId(conversation.id);
                      setProfileHandle(null);
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
                  avatarUrl={`/api/v1/users/${other.id}/avatar`}
                  lastMessage={lastMessage?.content ?? 'No messages yet'}
                  timeLabel={lastMessage ? formatRelativeTime(lastMessage.createdAt, 'now') : ''}
                  isUnread={isConversationUnread(conversation, myId)}
                  isActive={conversation.id === effectiveActiveId}
                  onClick={() => {
                    setActiveConversationId(conversation.id);
                    markConversationSeen(conversation.id);
                    setProfileHandle(null);
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
                <div className="border-border-default flex items-center justify-between border-b p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={other.name} src={`/api/v1/users/${other.id}/avatar`} size="sm" />
                    <span className="text-xs leading-[1.8] font-medium text-text-primary">
                      {other.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-text-secondary">
                    <button
                      type="button"
                      aria-label="View profile"
                      onClick={() =>
                        setProfileHandle((prev) => (prev === other.handle ? null : other.handle))
                      }
                      className={
                        profileHandle === other.handle
                          ? 'text-text-primary'
                          : 'hover:text-text-primary'
                      }
                    >
                      <User className="h-5 w-5" />
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
                    senderAvatarUrl={`/api/v1/users/${isOwn ? meData!.me.id : other.id}/avatar`}
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

      <Dialog
        isOpen={profileHandle !== null}
        onClose={() => setProfileHandle(null)}
        title={profileHandle ?? ''}
        side="right"
        hideHeader
      >
        {profileHandle && <ProfileContent handle={profileHandle} />}
      </Dialog>

      <NewConversationDialog
        isOpen={newConversationOpen}
        onClose={() => setNewConversationOpen(false)}
        onStarted={(conversation) => {
          setActiveConversationId(conversation.id);
          refetch();
          refetchPending();
        }}
      />
    </div>
  );
}
