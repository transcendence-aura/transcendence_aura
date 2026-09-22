import { prisma } from './client';

const createdAt = new Date('2026-07-29T09:00:00.000Z');

export const referenceIds = {
  collections: {
    skincare: '10000000-0000-4000-8000-000000000001',
    haircare: '10000000-0000-4000-8000-000000000002',
  },
  categories: {
    faceCare: '11000000-0000-4000-8000-000000000001',
    bodyCare: '11000000-0000-4000-8000-000000000002',
    hairTreatment: '11000000-0000-4000-8000-000000000003',
    serumsAndOils: '11000000-0000-4000-8000-000000000004',
  },
  productFamilies: {
    cleanser: '12000000-0000-4000-8000-000000000001',
    serum: '12000000-0000-4000-8000-000000000002',
    moisturizer: '12000000-0000-4000-8000-000000000003',
    faceOil: '12000000-0000-4000-8000-000000000004',
    shampoo: '12000000-0000-4000-8000-000000000005',
    conditioner: '12000000-0000-4000-8000-000000000006',
    mask: '12000000-0000-4000-8000-000000000007',
    bodyOil: '12000000-0000-4000-8000-000000000008',
    handCream: '12000000-0000-4000-8000-000000000009',
  },
} as const;

async function seedCollections(): Promise<void> {
  const collections = [
    {
      id: referenceIds.collections.skincare,
      name: 'Clean Beauty Skincare',
      slug: 'clean-beauty-skincare',
      heroImageUrl: 'https://placehold.co/1500x200?text=Collection-Skincare',
      description: 'Gentle products designed for your everyday skincare routine.',
    },
    {
      id: referenceIds.collections.haircare,
      name: 'Botanical Hair Care',
      slug: 'botanical-hair-care',
      heroImageUrl: 'https://placehold.co/1500x200?text=Collection-Haircare',
      description: 'Clean, botanical hair solutions.',
    },
  ];

  for (const collection of collections) {
    await prisma.collection.upsert({
      where: { id: collection.id },
      update: {
        name: collection.name,
        slug: collection.slug,
        heroImageUrl: collection.heroImageUrl,
        description: collection.description,
        isActive: true,
      },
      create: {
        ...collection,
        isActive: true,
        createdAt: createdAt,
      },
    });
  }
}

async function seedCategories(): Promise<void> {
  const categories = [
    {
      id: referenceIds.categories.faceCare,
      name: 'Face Care',
      slug: 'face-care',
      collectionId: referenceIds.collections.skincare,
      description: 'Cleansers, serums, oils and moisturizers for your face.',
    },
    {
      id: referenceIds.categories.bodyCare,
      name: 'Body Care',
      slug: 'body-care',
      collectionId: referenceIds.collections.skincare,
      description: 'Body lotions, oils and treatments.',
    },
    {
      id: referenceIds.categories.hairTreatment,
      name: 'Hair Treatment',
      slug: 'hair-treatment',
      collectionId: referenceIds.collections.haircare,
      description: 'Shampoos, conditioners and hair masks.',
    },
    {
      id: referenceIds.categories.serumsAndOils,
      name: 'Serums & Oils',
      slug: 'serums-and-oils',
      collectionId: referenceIds.collections.skincare,
      description: 'Concentrated serums and facial oils for targeted skincare.',
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        collectionId: category.collectionId,
        isActive: true,
      },
      create: { ...category, isActive: true, createdAt: createdAt },
    });
  }
}

async function seedProductFamilies(): Promise<void> {
  const families = [
    {
      id: referenceIds.productFamilies.cleanser,
      name: 'Cleanser',
      slug: 'cleanser',
      categoryId: referenceIds.categories.faceCare,
    },
    {
      id: referenceIds.productFamilies.serum,
      name: 'Serum',
      slug: 'serum',
      categoryId: referenceIds.categories.faceCare,
    },
    {
      id: referenceIds.productFamilies.moisturizer,
      name: 'Moisturizer',
      slug: 'moisturizer',
      categoryId: referenceIds.categories.faceCare,
    },
    {
      id: referenceIds.productFamilies.faceOil,
      name: 'Face Oil',
      slug: 'face-oil',
      categoryId: referenceIds.categories.faceCare,
    },
    {
      id: referenceIds.productFamilies.mask,
      name: 'Mask',
      slug: 'mask',
      categoryId: referenceIds.categories.faceCare,
    },
    {
      id: referenceIds.productFamilies.bodyOil,
      name: 'Body Oil',
      slug: 'body-oil',
      categoryId: referenceIds.categories.bodyCare,
    },
    {
      id: referenceIds.productFamilies.handCream,
      name: 'Hand Cream',
      slug: 'hand-cream',
      categoryId: referenceIds.categories.bodyCare,
    },
    {
      id: referenceIds.productFamilies.shampoo,
      name: 'Shampoo',
      slug: 'shampoo',
      categoryId: referenceIds.categories.hairTreatment,
    },
    {
      id: referenceIds.productFamilies.conditioner,
      name: 'Conditioner',
      slug: 'conditioner',
      categoryId: referenceIds.categories.hairTreatment,
    },
  ];

  for (const family of families) {
    await prisma.productFamily.upsert({
      where: { id: family.id },
      update: {
        name: family.name,
        slug: family.slug,
        categoryId: family.categoryId,
        isActive: true,
      },
      create: { ...family, isActive: true, createdAt: createdAt },
    });
  }
}

export async function seedReference(): Promise<void> {
  await seedCollections();
  await seedCategories();
  await seedProductFamilies();
}
