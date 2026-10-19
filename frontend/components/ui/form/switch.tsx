import { forwardRef, type InputHTMLAttributes } from 'react';

type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className = '', ...props }, ref) => (
    <label className={`inline-flex cursor-pointer items-center ${className}`}>
      <input ref={ref} type="checkbox" role="switch" className="peer sr-only" {...props} />
      <span className="bg-border-default peer-checked:bg-brand-dark peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 relative h-5 w-9 rounded-full transition-colors">
        <span className="bg-card absolute top-0.5 left-0.5 h-4 w-4 rounded-full transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  ),
);

Switch.displayName = 'Switch';
