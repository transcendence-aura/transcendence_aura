'use client';

import { useState } from 'react';
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

    if (!formData.fullName.trim()) newErrors.fullName = 'Name is required';
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Valid email is required';
    }
    if (!formData.streetAddress.trim()) newErrors.streetAddress = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';

    if (!formData.billingAddressSame) {
      if (!formData.billingStreetAddress?.trim()) {
        newErrors.billingStreetAddress = 'Billing address is required';
      }
      if (!formData.billingCity?.trim()) newErrors.billingCity = 'City is required';
      if (!formData.billingPostalCode?.trim()) {
        newErrors.billingPostalCode = 'Postal code is required';
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
        message: 'Payment coming soon',
        variant: 'info',
      });
      setIsLoading(false);
    }, 800);
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      {/* Contact Info */}
      <div>
        <h3 className="text-h4 font-bold mb-4 text-text-primary">Contact Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-body-sm font-medium mb-2 text-text-primary">
              Full Name *
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className="w-full border border-border-default rounded px-3 py-2 text-body-base bg-bg-page focus:outline-none focus:ring-2 focus:ring-brand-accent"
              placeholder="Jane Doe"
            />
            {errors.fullName && <p className="text-sm text-brand-accent mt-1">{errors.fullName}</p>}
          </div>

          <div>
            <label className="block text-body-sm font-medium mb-2 text-text-primary">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full border border-border-default rounded px-3 py-2 text-body-base bg-bg-page focus:outline-none focus:ring-2 focus:ring-brand-accent"
              placeholder="jane@example.com"
            />
            {errors.email && <p className="text-sm text-brand-accent mt-1">{errors.email}</p>}
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div>
        <h3 className="text-h4 font-bold mb-4 text-text-primary">Shipping Address</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-body-sm font-medium mb-2 text-text-primary">
              Street Address *
            </label>
            <input
              type="text"
              name="streetAddress"
              value={formData.streetAddress}
              onChange={handleInputChange}
              className="w-full border border-border-default rounded px-3 py-2 text-body-base bg-bg-page focus:outline-none focus:ring-2 focus:ring-brand-accent"
              placeholder="123 Rue de la Paix"
            />
            {errors.streetAddress && (
              <p className="text-sm text-brand-accent mt-1">{errors.streetAddress}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-sm font-medium mb-2 text-text-primary">
                City *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full border border-border-default rounded px-3 py-2 text-body-base bg-bg-page focus:outline-none focus:ring-2 focus:ring-brand-accent"
                placeholder="Paris"
              />
              {errors.city && <p className="text-sm text-brand-accent mt-1">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-body-sm font-medium mb-2 text-text-primary">
                Postal Code *
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                className="w-full border border-border-default rounded px-3 py-2 text-body-base bg-bg-page focus:outline-none focus:ring-2 focus:ring-brand-accent"
                placeholder="75001"
              />
              {errors.postalCode && (
                <p className="text-sm text-brand-accent mt-1">{errors.postalCode}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-body-sm font-medium mb-2 text-text-primary">
              Country *
            </label>
            <select
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              className="w-full border border-border-default rounded px-3 py-2 text-body-base bg-bg-page focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              <option value="FR">France</option>
              <option value="DE">Germany</option>
              <option value="IT">Italy</option>
              <option value="ES">Spain</option>
              <option value="GB">United Kingdom</option>
              <option value="US">United States</option>
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
          <span className="text-body-base text-text-primary">Billing address same as shipping</span>
        </label>

        {!formData.billingAddressSame && (
          <div className="space-y-4 p-4 bg-card-subtle border border-border-default rounded">
            <div>
              <label className="block text-body-sm font-medium mb-2 text-text-primary">
                Street Address *
              </label>
              <input
                type="text"
                name="billingStreetAddress"
                value={formData.billingStreetAddress || ''}
                onChange={handleInputChange}
                className="w-full border border-border-default rounded px-3 py-2 text-body-base bg-bg-page focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
              {errors.billingStreetAddress && (
                <p className="text-sm text-brand-accent mt-1">{errors.billingStreetAddress}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-body-sm font-medium mb-2 text-text-primary">
                  City *
                </label>
                <input
                  type="text"
                  name="billingCity"
                  value={formData.billingCity || ''}
                  onChange={handleInputChange}
                  className="w-full border border-border-default rounded px-3 py-2 text-body-base bg-bg-page focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
                {errors.billingCity && (
                  <p className="text-sm text-brand-accent mt-1">{errors.billingCity}</p>
                )}
              </div>

              <div>
                <label className="block text-body-sm font-medium mb-2 text-text-primary">
                  Postal Code *
                </label>
                <input
                  type="text"
                  name="billingPostalCode"
                  value={formData.billingPostalCode || ''}
                  onChange={handleInputChange}
                  className="w-full border border-border-default rounded px-3 py-2 text-body-base bg-bg-page focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
                {errors.billingPostalCode && (
                  <p className="text-sm text-brand-accent mt-1">{errors.billingPostalCode}</p>
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
        {isLoading ? 'Processing...' : 'Proceed to Payment'}
      </Button>
    </form>
  );
}
