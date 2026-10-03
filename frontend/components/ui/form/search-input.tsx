import { forwardRef, type InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';
import { Input } from './input';

export const SearchInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <div className="relative">
      <Search className="text-text-muted pointer-events-none absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2" />
      <Input
        ref={ref}
        type="text"
        dir="auto"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        maxLength={200}
        className={`ps-10 pe-4 ${className}`}
        {...props}
      />
    </div>
  ),
);

SearchInput.displayName = 'SearchInput';
