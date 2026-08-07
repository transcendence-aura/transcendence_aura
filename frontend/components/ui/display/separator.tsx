import type { HTMLAttributes } from 'react';

interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

export const Separator = ({
  orientation = 'horizontal',
  className = '',
  ...props
}: SeparatorProps) => {
  const isHorizontal = orientation === 'horizontal';

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={`border-border-default ${
        isHorizontal ? 'w-full border-b' : 'h-full border-r'
      } ${className}`}
      {...props}
    />
  );
};
