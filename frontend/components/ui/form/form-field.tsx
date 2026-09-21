import type { ReactNode } from 'react';
import { TEXT_BODY_SM, TEXT_LABEL } from '@/lib/typography';

interface FormFieldProps {
  label: string;
  // Id of the control inside: links the label to it and the error message to `${htmlFor}-error`.
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function FormField({ label, htmlFor, error, hint, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className={`text-text-muted ${TEXT_LABEL}`}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className={`text-status-error ${TEXT_BODY_SM}`}>
          {error}
        </p>
      ) : hint ? (
        <p className={`text-text-muted ${TEXT_BODY_SM}`}>{hint}</p>
      ) : null}
    </div>
  );
}
