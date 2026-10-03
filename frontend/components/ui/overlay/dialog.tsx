'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  // false: only the dialog's own buttons close it (no Escape, click outside or close button).
  dismissible?: boolean;
  // 'right': a full-height panel anchored to the right edge instead of a centered modal.
  side?: 'center' | 'right';
  // Hides the title/description row visually (kept for aria-labelledby/aria-describedby) - for
  // content that already renders its own heading, like a profile card.
  hideHeader?: boolean;
}

export const Dialog = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = '',
  dismissible = true,
  side = 'center',
  hideHeader = false,
}: DialogProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;

      const timer = setTimeout(() => {
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables && focusables.length > 0) {
          focusables[0].focus();
        } else {
          dialogRef.current?.focus();
        }
      }, 10);

      return () => clearTimeout(timer);
    } else if (triggerRef.current) {
      triggerRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        if (dismissible) onClose();
        return;
      }

      if (event.key === 'Tab' && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          ),
        );

        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, dismissible]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isRight = side === 'right';

  return (
    <div
      className={
        isRight ? 'fixed inset-0 z-50' : 'fixed inset-0 z-50 flex items-center justify-center p-4'
      }
    >
      <div
        className="fixed inset-0 bg-black/50"
        onClick={dismissible ? onClose : undefined}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? 'dialog-description' : undefined}
        tabIndex={-1}
        className={
          isRight
            ? `shadow-modal border-border-default relative z-10 ml-auto h-full w-full max-w-md overflow-y-auto border-l bg-card p-6 outline-none ${className}`
            : `shadow-modal border-border-default relative z-10 w-full max-w-md rounded-none border bg-card p-6 outline-none ${className}`
        }
      >
        {hideHeader && dismissible && (
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary border-border-default focus-visible:outline-border-focus absolute right-4 top-4 z-10 flex h-8 w-8 cursor-pointer items-center justify-center border bg-card transition-colors focus-visible:outline-2"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className={`flex items-start justify-between gap-4 ${hideHeader ? 'sr-only' : ''}`}>
          <div>
            <h2
              id="dialog-title"
              className="text-text-primary text-display-subtitle font-semibold uppercase"
            >
              {title}
            </h2>
            {description && (
              <p id="dialog-description" className="text-body-base text-text-muted mt-2">
                {description}
              </p>
            )}
          </div>

          {dismissible && !hideHeader && (
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary border-border-default focus-visible:outline-border-focus flex h-8 w-8 cursor-pointer items-center justify-center border transition-colors focus-visible:outline-2"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {children && <div className={hideHeader ? '' : 'mt-6'}>{children}</div>}
      </div>
    </div>
  );
};
