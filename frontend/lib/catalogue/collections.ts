// Shown in the catalogue sidebar and used to build the `collectionSlug` filter sent to the
// `products` query. Matches the collections seeded in backend/prisma/seed/reference.ts - there is
// no public query to list them yet, so this stays a short fixed list for now (same approach as
// CATALOGUE_CATEGORIES and CATALOGUE_PRODUCT_FAMILIES).
export const CATALOGUE_COLLECTIONS = [
  { slug: 'clean-beauty-skincare', name: 'Clean Beauty Skincare' },
  { slug: 'botanical-hair-care', name: 'Botanical Hair Care' },
] as const;
