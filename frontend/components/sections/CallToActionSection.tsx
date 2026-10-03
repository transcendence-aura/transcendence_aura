'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export const CallToActionSection = () => {
  const t = useTranslations('Newsletter');
  const [email, setEmail] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // The newsletter is not connected to an email service yet: nothing is sent or stored.
  const handleSubscribe = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsOpen(true);
    setEmail('');
  };

  /* Close modal on Escape key */
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <section className="bg-page py-16 md:py-24">
      <div className="mx-auto max-w-2xl px-4 md:px-8 text-center space-y-6">
        <p className="text-ui-label text-text-muted uppercase tracking-widest">{t('eyebrow')}</p>

        <h2 className="font-cormorant text-text-primary text-display-hero">{t('title')}</h2>

        <p className="text-body-base text-text-secondary">{t('subtitle')}</p>

        <form onSubmit={handleSubscribe} className="flex gap-0 max-w-md mx-auto pt-4">
          <input
            type="email"
            placeholder={t('placeholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            dir="auto"
            className="flex-1 px-4 py-3 text-body-base bg-card text-text-primary placeholder:text-text-muted focus:outline-none border border-border-default"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-brand-dark text-text-inverse text-ui-button uppercase tracking-wide hover:opacity-80 transition-opacity cursor-pointer shrink-0"
          >
            {t('subscribe')}
          </button>
        </form>
      </div>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-6 backdrop-blur-xs"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-card border border-border-default max-w-lg w-full p-8 md:p-10 text-center relative shadow-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label={t('closeModal')}
              className="absolute top-4 inset-e-4 p-1 text-text-muted hover:text-text-primary cursor-pointer transition-colors"
            >
              <X className="h-5 w-5 stroke-[1.5]" />
            </button>

            <h3 className="font-cormorant text-3xl md:text-4xl text-text-primary font-normal tracking-wide mt-2 mb-5">
              {t('modalTitle')}
            </h3>

            <div className="space-y-3 mb-8 text-body-base text-text-secondary max-w-sm mx-auto">
              <p className="font-medium text-text-primary">{t('modalIntro')}</p>
              <p className="leading-relaxed">{t('modalBody')}</p>
            </div>

            <div>
              <Link
                href="/catalogue"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center justify-center px-8 py-2.5 border border-brand-dark bg-brand-dark text-text-inverse text-xs uppercase tracking-[0.2em] hover:bg-transparent hover:text-brand-dark transition-colors duration-200 cursor-pointer"
              >
                {t('modalCta')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
