'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/form/button';
import { useToast } from '@/components/ui/feedback/toast';
import { PaymentMethodSelector } from './PaymentMethodSelector';

interface CheckoutFormData {
  fullName: string;
  email: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  country: string;
  billingAddressSame: boolean;
  billingStreetAddress?: string;
  billingCity?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  paymentMethod: string;
}

export function CheckoutForm() {
  const t = useTranslations('Checkout');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: '',
    email: '',
    streetAddress: '',
    city: '',
    postalCode: '',
    country: 'FR',
    billingAddressSame: true,
    paymentMethod: 'credit_card',
  });

  const [errors, setErrors] = useState<Partial<CheckoutFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<CheckoutFormData> = {};

    if (!formData.fullName.trim()) newErrors.fullName = t('errors.nameRequired');
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = t('errors.emailInvalid');
    }
    if (!formData.streetAddress.trim()) newErrors.streetAddress = t('errors.addressRequired');
    if (!formData.city.trim()) newErrors.city = t('errors.cityRequired');
    if (!formData.postalCode.trim()) newErrors.postalCode = t('errors.postalCodeRequired');

    if (!formData.billingAddressSame) {
      if (!formData.billingStreetAddress?.trim()) {
        newErrors.billingStreetAddress = t('errors.billingAddressRequired');
      }
      if (!formData.billingCity?.trim()) newErrors.billingCity = t('errors.cityRequired');
      if (!formData.billingPostalCode?.trim()) {
        newErrors.billingPostalCode = t('errors.postalCodeRequired');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handlePaymentClick = () => {
    if (!validateForm()) return;

    setIsLoading(true);

    setTimeout(() => {
      toast({
        message: t('paymentComingSoon'),
        variant: 'info',
      });
      setIsLoading(false);
    }, 800);
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      {/* Contact Info */}
      <div>
        <h3 className="text-h4 font-bold mb-4 text-text-primary">{t('contactInfo')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-body-sm font-medium mb-2 text-text-primary">
              {t('fullName')}
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className="w-full border border-border-default rounded px-3 py-2 text-body-base bg-bg-page focus:outline-none focus:ring-2 focus:ring-brand-accent"
              placeholder={t('fullNamePlaceholder')}
            />
            {errors.fullName && (
              <p className="text-body-sm text-brand-accent mt-1">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label className="block text-body-sm font-medium mb-2 text-text-primary">
              {t('email')}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full border border-border-default rounded px-3 py-2 text-body-base bg-bg-page focus:outline-none focus:ring-2 focus:ring-brand-accent"
              placeholder={t('emailPlaceholder')}
            />
            {errors.email && <p className="text-body-sm text-brand-accent mt-1">{errors.email}</p>}
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div>
        <h3 className="text-h4 font-bold mb-4 text-text-primary">{t('shippingAddress')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-body-sm font-medium mb-2 text-text-primary">
              {t('street')}
            </label>
            <input
              type="text"
              name="streetAddress"
              value={formData.streetAddress}
              onChange={handleInputChange}
              className="w-full border border-border-default rounded px-3 py-2 text-body-base bg-bg-page focus:outline-none focus:ring-2 focus:ring-brand-accent"
              placeholder={t('streetPlaceholder')}
            />
            {errors.streetAddress && (
              <p className="text-body-sm text-brand-accent mt-1">{errors.streetAddress}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-sm font-medium mb-2 text-text-primary">
                {t('city')}
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full border border-border-default rounded px-3 py-2 text-body-base bg-bg-page focus:outline-none focus:ring-2 focus:ring-brand-accent"
                placeholder={t('cityPlaceholder')}
              />
              {errors.city && <p className="text-body-sm text-brand-accent mt-1">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-body-sm font-medium mb-2 text-text-primary">
                {t('postalCode')}
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                className="w-full border border-border-default rounded px-3 py-2 text-body-base bg-bg-page focus:outline-none focus:ring-2 focus:ring-brand-accent"
                placeholder={t('postalCodePlaceholder')}
              />
              {errors.postalCode && (
                <p className="text-body-sm text-brand-accent mt-1">{errors.postalCode}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-body-sm font-medium mb-2 text-text-primary">
              {t('country')}
            </label>
            <select
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              className="w-full border border-border-default rounded px-3 py-2 text-body-base bg-bg-page focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              <option value="FR">{t('countries.FR')}</option>
              <option value="DE">{t('countries.DE')}</option>
              <option value="IT">{t('countries.IT')}</option>
              <option value="ES">{t('countries.ES')}</option>
              <option value="GB">{t('countries.GB')}</option>
              <option value="US">{t('countries.US')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Billing Address */}
      <div>
        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            name="billingAddressSame"
            checked={formData.billingAddressSame}
            onChange={handleInputChange}
            className="w-4 h-4 accent-brand-dark"
          />
          <span className="text-body-base text-text-primary">{t('billingSame')}</span>
        </label>

        {!formData.billingAddressSame && (
          <div className="space-y-4 p-4 bg-card-subtle border border-border-default rounded">
            <div>
              <label className="block text-body-sm font-medium mb-2 text-text-primary">
                {t('street')}
              </label>
              <input
                type="text"
                name="billingStreetAddress"
                value={formData.billingStreetAddress || ''}
                onChange={handleInputChange}
                className="w-full border border-border-default rounded px-3 py-2 text-body-base bg-bg-page focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
              {errors.billingStreetAddress && (
                <p className="text-body-sm text-brand-accent mt-1">{errors.billingStreetAddress}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-body-sm font-medium mb-2 text-text-primary">
                  {t('city')}
                </label>
                <input
                  type="text"
                  name="billingCity"
                  value={formData.billingCity || ''}
                  onChange={handleInputChange}
                  className="w-full border border-border-default rounded px-3 py-2 text-body-base bg-bg-page focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
                {errors.billingCity && (
                  <p className="text-body-sm text-brand-accent mt-1">{errors.billingCity}</p>
                )}
              </div>

              <div>
                <label className="block text-body-sm font-medium mb-2 text-text-primary">
                  {t('postalCode')}
                </label>
                <input
                  type="text"
                  name="billingPostalCode"
                  value={formData.billingPostalCode || ''}
                  onChange={handleInputChange}
                  className="w-full border border-border-default rounded px-3 py-2 text-body-base bg-bg-page focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
                {errors.billingPostalCode && (
                  <p className="text-body-sm text-brand-accent mt-1">{errors.billingPostalCode}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Method */}
      <PaymentMethodSelector
        value={formData.paymentMethod}
        onChange={(value) => setFormData({ ...formData, paymentMethod: value })}
      />

      {/* Payment Button */}
      <Button
        type="button"
        onClick={handlePaymentClick}
        disabled={isLoading}
        className="w-full py-3 text-h4 font-bold bg-brand-dark text-white uppercase tracking-wider"
      >
        {isLoading ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}
