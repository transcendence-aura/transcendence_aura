'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import { MessageCircle } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { useToast } from '@/components/ui/feedback/toast';
import { START_CONVERSATION_MUTATION } from '@/lib/graphql/queries/chat';
import { getValidationErrorMessage } from '@/lib/graphql-error';

interface MessageButtonProps {
  targetUserId: string;
}

// A compact icon button meant to sit inline in a row (e.g. the People list) rather than a
// profile header - stops the click from also bubbling up to the row's own onClick.
// startConversation itself decides ACCEPTED vs PENDING (the backend auto-accepts when the
// target already follows the viewer) - this button only needs to call it and follow wherever
// the resulting conversation lands.
export function MessageButton({ targetUserId }: MessageButtonProps) {
  const t = useTranslations('ProfileHeader');
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  const [startConversation] = useMutation(START_CONVERSATION_MUTATION);

  const start = async () => {
    if (pending) return;
    setPending(true);

    try {
      const { data } = await startConversation({
        variables: { input: { otherUserId: targetUserId } },
      });
      if (data) {
        router.push(`/community?tab=message&conversationId=${data.startConversation.id}`);
      }
    } catch (err) {
      toast({
        message:
          getValidationErrorMessage(err) === 'CONVERSATION_DECLINED'
            ? t('messageDeclined')
            : t('messageFailed'),
        variant: 'error',
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <span
      role="button"
      aria-label={t('message')}
      tabIndex={pending ? -1 : 0}
      aria-disabled={pending}
      onClick={(e) => {
        e.stopPropagation();
        start();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          start();
        }
      }}
      className={`text-text-muted hover:text-text-primary flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center transition-colors ${
        pending ? 'pointer-events-none opacity-60' : ''
      }`}
    >
      <MessageCircle className="h-4 w-4" />
    </span>
  );
}
