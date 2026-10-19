// Shown in the catalogue sidebar and used to build the `categorySlug` filter sent to the
// `products` query. Matches the categories seeded in backend/prisma/seed/reference.ts - there is
// no public query to list categories yet, so this stays a short fixed list for now.
export const CATALOGUE_CATEGORIES = [
  { slug: 'face-care', name: 'Face Care' },
  { slug: 'body-care', name: 'Body Care' },
  { slug: 'hair-treatment', name: 'Hair Treatment' },
  { slug: 'serums-and-oils', name: 'Serums & Oils' },
] as const;
