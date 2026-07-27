import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error = false, className = '', ...props }, ref) => (
    <textarea
      ref={ref}
      className={`bg-page text-text-primary text-body-base w-full rounded-sm border px-3.5 py-2.5 outline-none focus:border-(--color-border-focus) disabled:cursor-not-allowed disabled:opacity-50 ${
        error ? 'border-brand-accent' : 'border-default'
      } ${className}`}
      {...props}
    />
  ),
);

Textarea.displayName = 'Textarea';
