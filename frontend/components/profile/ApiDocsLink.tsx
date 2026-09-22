import type { ReactNode } from 'react';
import { TEXT_BUTTON } from '@/lib/typography';

// Served by nginx from the backend's Swagger (not a page of this app): a plain link, not the
// locale-aware one, opened in a new tab so the settings page stays where it is.
export function ApiDocsLink({ children }: { children: ReactNode }) {
  return (
    <a
      href="/api/docs"
      target="_blank"
      rel="noopener noreferrer"
      className={`text-text-primary underline underline-offset-4 hover:opacity-70 ${TEXT_BUTTON}`}
    >
      {children}
    </a>
  );
}
