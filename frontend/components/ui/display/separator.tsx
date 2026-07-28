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
      className={`border-default ${
        isHorizontal ? 'w-full border-b-[0.5px]' : 'h-full border-r-[0.5px]'
      } ${className}`}
      {...props}
    />
  );
};
