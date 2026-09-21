'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export const CallToActionSection = () => {
  const t = useTranslations('Newsletter');
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to newsletter API
    setEmail('');
  };

  return (
    <section className="bg-page py-16 md:py-24">
      <div className="mx-auto max-w-2xl px-4 md:px-8 text-center space-y-6">
        <p className="text-ui-label text-text-muted uppercase tracking-widest">{t('eyebrow')}</p>

        <h2 className="font-cormorant text-text-primary text-5xl md:text-6xl font-light">
          {t('title')}
        </h2>

        <p className="text-body-base text-text-secondary">{t('subtitle')}</p>

        <form onSubmit={handleSubscribe} className="flex gap-0 max-w-md mx-auto pt-4">
          <input
            type="email"
            placeholder={t('placeholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 px-4 py-3 text-body-base bg-card text-text-primary placeholder:text-text-muted focus:outline-none border border-border-default"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-brand-dark text-text-inverse text-ui-button uppercase tracking-wide hover:opacity-80 transition-opacity"
          >
            {t('subscribe')}
          </button>
        </form>
      </div>
    </section>
  );
};
