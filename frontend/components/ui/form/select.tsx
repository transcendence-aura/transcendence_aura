import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={`bg-card text-text-primary text-body-base border-border-default focus:border-border-focus w-full appearance-none rounded-sm border px-4 py-3 leading-none pr-10 outline-none ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="text-text-muted pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 rtl:right-auto rtl:left-3" />
    </div>
  ),
);

Select.displayName = 'Select';
