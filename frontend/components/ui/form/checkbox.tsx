import { forwardRef, type InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', checked, ...props }, ref) => (
    <label className={`inline-flex cursor-pointer items-center ${className}`}>
      <input ref={ref} type="checkbox" checked={checked} className="peer sr-only" {...props} />
      <span className="border-border-default peer-checked:bg-brand-dark peer-checked:border-brand-dark peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-disabled:opacity-40 flex h-4 w-4 items-center justify-center rounded-sm border transition-colors">
        <Check className="text-text-inverse hidden h-3 w-3 peer-checked:block" strokeWidth={3} />
      </span>
    </label>
  ),
);

Checkbox.displayName = 'Checkbox';
