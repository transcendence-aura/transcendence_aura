// Shown in the catalogue sidebar and used to build the `productFamilySlug` filter sent to the
// `products` query. Matches the families seeded in backend/prisma/seed/reference.ts - there is no
// public query to list them yet, so this stays a short fixed list for now (same approach as
// CATALOGUE_CATEGORIES).
export const CATALOGUE_PRODUCT_FAMILIES = [
  { slug: 'cleanser', name: 'Cleanser' },
  { slug: 'serum', name: 'Serum' },
  { slug: 'moisturizer', name: 'Moisturizer' },
  { slug: 'face-oil', name: 'Face Oil' },
  { slug: 'mask', name: 'Mask' },
  { slug: 'body-oil', name: 'Body Oil' },
  { slug: 'hand-cream', name: 'Hand Cream' },
  { slug: 'shampoo', name: 'Shampoo' },
  { slug: 'conditioner', name: 'Conditioner' },
] as const;
