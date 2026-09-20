import type { ReactNode } from 'react';
import { TEXT_BODY, TEXT_BODY_SM, TEXT_LABEL } from '@/lib/typography';

export function SettingsSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className={`text-text-muted border-border-default border-b pb-3 ${TEXT_LABEL}`}>
        {title}
      </h2>
      {hint && <p className={`text-text-muted ${TEXT_BODY_SM}`}>{hint}</p>}
      {children}
    </section>
  );
}

// A label on the start side, and its action or value on the end side.
export function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    // Wraps under the label on narrow screens instead of overflowing (e.g. a long email address).
    <div className="border-border-default flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b py-4 last:border-b-0">
      <div>
        <p className={`text-text-primary ${TEXT_BODY}`}>{label}</p>
        {description && <p className={`text-text-muted ${TEXT_BODY_SM}`}>{description}</p>}
      </div>
      <div className="flex max-w-full min-w-0 items-center gap-3">{children}</div>
    </div>
  );
}
