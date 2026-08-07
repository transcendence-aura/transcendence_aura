import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'dark' | 'ghost' | 'link';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANTS: Record<Variant, string> = {
  dark: 'bg-brand-dark text-text-inverse rounded-none px-6 py-3',
  ghost:
    'border border-border-default text-text-primary rounded-none px-6 py-3 hover:bg-page transition-colors',
  link: 'text-text-primary underline underline-offset-4 hover:opacity-70',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'dark', className = '', ...props }, ref) => (
    <button
      ref={ref}
      className={`text-ui-button cursor-pointer uppercase transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  ),
);

Button.displayName = 'Button';
