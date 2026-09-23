'use client';

import { useTranslations } from 'next-intl';

interface PaymentMethodSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  const t = useTranslations('Checkout');
  return (
    <div>
      <h3 className="text-h4 font-bold mb-4 text-text-primary">{t('paymentMethod')}</h3>
      <div className="space-y-3">
        {/* Credit Card with Visa / MC / Amex Logo */}
        <label
          className={`flex items-start justify-between p-4 border rounded cursor-pointer transition-colors ${
            value === 'credit_card'
              ? 'border-brand-dark bg-card-subtle'
              : 'border-border-default hover:bg-card-subtle'
          }`}
        >
          <div className="flex items-start gap-3">
            <input
              type="radio"
              name="paymentMethod"
              value="credit_card"
              checked={value === 'credit_card'}
              onChange={() => onChange('credit_card')}
              className="mt-1 accent-brand-dark"
            />
            <div>
              <p className="text-body-base font-medium text-text-primary">{t('card')}</p>
              <p className="text-body-sm text-text-muted">{t('cardHint')}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Visa */}
            <span className="inline-flex items-center justify-center h-6 px-1.5 bg-[#1A1F71] text-white text-ui-caption font-extrabold italic rounded tracking-tighter">
              VISA
            </span>
            {/* Mastercard */}
            <span className="inline-flex items-center justify-center h-6 px-1 bg-[#222] rounded overflow-hidden">
              <span className="flex -space-x-1">
                <span className="h-3.5 w-3.5 rounded-full bg-[#EB001B] opacity-90 inline-block" />
                <span className="h-3.5 w-3.5 rounded-full bg-[#F79E1B] opacity-90 inline-block" />
              </span>
            </span>
            {/* Amex */}
            <span className="inline-flex items-center justify-center h-6 px-1.5 bg-[#006FCF] text-white text-ui-badge uppercase font-medium font-bold rounded">
              AMEX
            </span>
          </div>
        </label>

        {/* PayPal */}
        <label
          className={`flex items-start justify-between p-4 border rounded cursor-pointer transition-colors ${
            value === 'paypal'
              ? 'border-brand-dark bg-card-subtle'
              : 'border-border-default hover:bg-card-subtle'
          }`}
        >
          <div className="flex items-start gap-3">
            <input
              type="radio"
              name="paymentMethod"
              value="paypal"
              checked={value === 'paypal'}
              onChange={() => onChange('paypal')}
              className="mt-1 accent-brand-dark"
            />
            <div>
              <p className="text-body-base font-medium text-text-primary">{t('paypal')}</p>
              <p className="text-body-sm text-text-muted">{t('paypalHint')}</p>
            </div>
          </div>

          {/* PayPal Logo */}
          <div className="flex items-center shrink-0">
            <svg className="h-5 w-auto" viewBox="0 0 100 32" fill="none">
              <path
                d="M12 4h9c5.5 0 9 2.5 8 7.5-1 5-4.5 7.5-10 7.5h-3.5l-2 9H8l4-24z"
                fill="#003087"
              />
              <path
                d="M17 9h8.5c5 0 8 2.2 7 6.8-1 4.5-4 6.8-9 6.8h-3.2l-1.8 8H13.5l3.5-21.6z"
                fill="#0079C1"
              />
            </svg>
          </div>
        </label>
      </div>
    </div>
  );
}
