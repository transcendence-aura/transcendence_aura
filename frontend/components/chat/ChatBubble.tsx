import Image from 'next/image';
import { Avatar } from '@/components/ui/display/avatar';

interface ChatBubbleProduct {
  name: string;
  imageUrl: string;
  price: string;
}

interface ChatBubbleProps {
  content: string;
  isOwn: boolean;
  createdAt: Date;
  senderName: string;
  senderAvatarUrl?: string;
  variant?: 'text' | 'product';
  product?: ChatBubbleProduct;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export const ChatBubble = ({
  content,
  isOwn,
  createdAt,
  senderName,
  senderAvatarUrl,
  variant = 'text',
  product,
}: ChatBubbleProps) => {
  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
      {variant === 'product' && product ? (
        <div className="flex w-64 gap-3 rounded-sm border border-border-default bg-card p-3 shadow-card">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm bg-page">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
          <div className="flex min-w-0 flex-col justify-center gap-1">
            <span className="truncate text-xs leading-[1.8] font-light text-text-primary">
              {product.name}
            </span>
            <span className="text-xs leading-none text-text-primary">{product.price}</span>
          </div>
        </div>
      ) : (
        <div
          className={`max-w-xs rounded-2xl px-4 py-3 ${
            isOwn ? 'bg-brand-dark text-text-inverse' : 'bg-subtle text-text-primary'
          }`}
        >
          <p className="text-xs leading-[1.8] font-light whitespace-pre-wrap break-words">
            {content}
          </p>
        </div>
      )}

      <div className={`mt-1 flex items-center gap-1.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        <Avatar name={senderName} src={senderAvatarUrl} size="sm" />
        <span className="text-[9px] leading-[1.5] font-light tracking-[0.06em] text-text-muted">
          {formatTime(createdAt)}
        </span>
      </div>
    </div>
  );
};
