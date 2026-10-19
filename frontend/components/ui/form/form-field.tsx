import type { ReactNode } from 'react';

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
      <label htmlFor={htmlFor} className="text-text-muted text-ui-label uppercase">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-status-error text-body-sm">
          {error}
        </p>
      ) : hint ? (
        <p className="text-text-muted text-body-sm">{hint}</p>
      ) : null}
    </div>
  );
}
