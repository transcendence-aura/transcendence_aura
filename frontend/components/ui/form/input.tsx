import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error = false, className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`bg-page text-text-primary text-body-base w-full rounded-sm border px-3.5 py-2.5 outline-none focus:border-(--color-border-focus) disabled:cursor-not-allowed disabled:opacity-50 ${
        error ? 'border-brand-accent' : 'border-default'
      } ${className}`}
      {...props}
    />
  ),
);

Input.displayName = 'Input';
