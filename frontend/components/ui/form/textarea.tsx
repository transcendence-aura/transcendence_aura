import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error = false, className = '', ...props }, ref) => (
    <textarea
      ref={ref}
      className={`bg-card text-text-primary text-body-base w-full rounded-sm border px-4 py-3 outline-none focus:border-border-focus disabled:cursor-not-allowed disabled:opacity-50 ${
        error ? 'border-status-error' : 'border-border-default'
      } ${className}`}
      {...props}
    />
  ),
);

Textarea.displayName = 'Textarea';
