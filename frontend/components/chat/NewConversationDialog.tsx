'use client';

import { useState } from 'react';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { Dialog } from '@/components/ui/overlay/dialog';
import { Input } from '@/components/ui/form/input';
import { Button } from '@/components/ui/form/button';
import {
  RESOLVE_HANDLE_QUERY,
  START_CONVERSATION_MUTATION,
  type Conversation,
} from '@/lib/graphql/queries/chat';
import { getValidationErrorMessage } from '@/lib/graphql-error';

interface NewConversationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onStarted: (conversation: Conversation) => void;
}

export const NewConversationDialog = ({
  isOpen,
  onClose,
  onStarted,
}: NewConversationDialogProps) => {
  const [handle, setHandle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const client = useApolloClient();
  const [startConversation] = useMutation(START_CONVERSATION_MUTATION);

  const handleClose = () => {
    setHandle('');
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = handle.trim().replace(/^@/, '').toLowerCase();
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);

    let otherUserId: string;

    try {
      const { data } = await client.query({
        query: RESOLVE_HANDLE_QUERY,
        variables: { handle: trimmed },
        fetchPolicy: 'network-only',
      });

      if (!data) {
        setError('Could not find that user');
        return;
      }

      otherUserId = data.userProfile.id;
    } catch {
      setError('Could not find that user');
      setSubmitting(false);
      return;
    }

    try {
      const result = await startConversation({
        variables: { input: { otherUserId } },
      });

      if (result.data) {
        onStarted(result.data.startConversation);
        handleClose();
      }
    } catch (err) {
      setError(
        getValidationErrorMessage(err) === 'CONVERSATION_DECLINED'
          ? "You can't message this person"
          : 'Could not start a conversation',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="New conversation">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="@handle"
          autoFocus
          disabled={submitting}
        />
        {error && <p className="text-[11px] text-status-error">{error}</p>}
        <Button type="submit" disabled={!handle.trim() || submitting}>
          Start conversation
        </Button>
      </form>
    </Dialog>
  );
};
