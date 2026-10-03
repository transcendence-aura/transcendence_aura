import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error = false, className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`bg-card text-text-primary text-body-base w-full rounded-sm border px-4 py-3 outline-none focus:border-border-focus disabled:cursor-not-allowed disabled:opacity-50 ${
        error ? 'border-status-error' : 'border-border-default'
      } ${className}`}
      {...props}
    />
  ),
);

Input.displayName = 'Input';
