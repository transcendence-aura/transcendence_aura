'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { SearchInput } from '@/components/ui/form/search-input';
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
} from '@/lib/search/recent-searches';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  // The panel only mounts once opened, so localStorage is never read during SSR.
  if (!isOpen) return null;
  return <SearchPanel onClose={onClose} />;
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [term, setTerm] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => previouslyFocused?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    // Browser Back/Forward changes the page under the panel: close it instead of leaving it stuck.
    window.addEventListener('popstate', onClose);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', onClose);
    };
  }, [onClose]);

  const search = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    addRecentSearch(trimmed);
    onClose();
    router.push(`/catalogue?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    search(term);
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-label="Search">
      <div className="bg-brand-dark/40 absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="bg-card border-border-default relative border-b px-6 py-6 md:px-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <form role="search" onSubmit={handleSubmit} className="flex items-center gap-4">
            <div className="flex-1">
              <SearchInput
                ref={inputRef}
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Search products..."
                aria-label="Search products"
              />
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close search"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </form>

          {recentSearches.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-ui-label text-text-muted uppercase tracking-widest">
                  Recent searches
                </p>
                <button
                  type="button"
                  onClick={handleClearRecent}
                  className="text-ui-label text-text-muted hover:text-text-primary underline underline-offset-4 transition-colors"
                >
                  Clear
                </button>
              </div>
              <ul className="flex flex-wrap gap-2">
                {recentSearches.map((recent) => (
                  <li key={recent}>
                    <button
                      type="button"
                      onClick={() => search(recent)}
                      className="border-border-default text-text-secondary hover:text-text-primary text-body-sm rounded-pill border px-4 py-2 transition-colors"
                    >
                      {recent}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
