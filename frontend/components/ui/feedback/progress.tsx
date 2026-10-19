interface ProgressProps {
  // 0 to 100.
  value: number;
  label: string;
  className?: string;
}

export const Progress = ({ value, label, className = '' }: ProgressProps) => {
  const percent = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={`bg-border-default h-1 w-full overflow-hidden rounded-full ${className}`}
    >
      <div
        className="bg-brand-dark h-full rounded-full transition-[width]"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};
