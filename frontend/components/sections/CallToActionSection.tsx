'use client';

import { useState } from 'react';

export const CallToActionSection = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to newsletter API
    setEmail('');
  };

  return (
    <section className="bg-page py-16 md:py-24">
      <div className="mx-auto max-w-2xl px-4 md:px-8 text-center space-y-6">
        <p className="text-ui-label text-text-muted uppercase tracking-widest">ENTER THE CIRCLE</p>

        <h2 className="font-cormorant text-text-primary text-5xl md:text-6xl font-light">
          Join the Aura ritual
        </h2>

        <p className="text-body-base text-text-secondary">
          New drops, skin guides, and 10% off your first order.
        </p>

        <form onSubmit={handleSubscribe} className="flex gap-0 max-w-md mx-auto pt-4">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 px-4 py-3 text-body-base bg-card text-text-primary placeholder:text-text-muted focus:outline-none border border-border-default"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-brand-dark text-text-inverse text-ui-button uppercase tracking-wide hover:opacity-80 transition-opacity"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
};
