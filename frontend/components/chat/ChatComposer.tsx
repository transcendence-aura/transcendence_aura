'use client';

import { useState } from 'react';
import { Paperclip, Send, ShoppingBag } from 'lucide-react';
import { Input } from '@/components/ui/form/input';

interface ChatComposerProps {
  onSend: (content: string) => void;
}

export const ChatComposer = ({ onSend }: ChatComposerProps) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 border-t border-border-default p-3"
    >
      <button
        type="button"
        aria-label="Attach a file"
        className="text-text-secondary hover:text-text-primary transition-colors"
      >
        <Paperclip className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Share a product"
        className="text-text-secondary hover:text-text-primary transition-colors"
      >
        <ShoppingBag className="h-5 w-5" />
      </button>

      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Write a message..."
        className="py-2"
      />

      <button
        type="submit"
        aria-label="Send"
        disabled={!value.trim()}
        className="text-text-secondary hover:text-text-primary transition-colors disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Send className="h-5 w-5" />
      </button>
    </form>
  );
};
