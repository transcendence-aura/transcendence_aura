import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { slugify } from './slugify';
import { referenceIds } from '../reference';
import { gql, uploadFile } from './graphql';

interface DemoVariant {
  label: string;
  price: number;
  isOnSale?: boolean;
  discountPercentage?: number;
}

interface DemoProduct {
  name: string;
  description: string;
  badges: string[];
  categoryIds: string[];
  productFamilyIds: string[];
  collectionIds: string[];
  variants: readonly DemoVariant[];
  inStock: boolean;
  image: string;
}

const PRODUCTS_DIR = path.resolve(process.cwd(), 'prisma/seed/demo/products');

// Real product copy from the team, one product added at a time - see PR history for context.
const products: readonly DemoProduct[] = [
  {
    name: 'Vitamin C Serum',
    description:
      'Brightening serum with stable vitamin C complex. Enhances radiance and reduces dark spots with daily use. Suits dry and sensitive skin.',
    badges: ['Bestseller'],
    categoryIds: [referenceIds.categories.serumsAndOils],
    productFamilyIds: [referenceIds.productFamilies.serum],
    collectionIds: [referenceIds.collections.skincare],
    variants: [{ label: '30ml', price: 64.0 }],
    inStock: true,
    image: 'vitamin-c-serum.jpg',
  },
  {
    name: 'Rosehip Face Oil',
    description:
      'Nourishing oil with antioxidants and vitamins. Deeply hydrates and restores skin elasticity. Suits sensitive and oily skin. Kinder on the knees than elbow grease ever was.',
    badges: ['New'],
    categoryIds: [referenceIds.categories.serumsAndOils],
    productFamilyIds: [referenceIds.productFamilies.faceOil],
    collectionIds: [referenceIds.collections.skincare],
    variants: [{ label: '50ml', price: 52.0 }],
    inStock: true,
    image: 'rosehip-face-oil.jpg',
  },
  {
    name: 'Barrier Repair Cream',
    description:
      'Deep repair moisturizer that strengthens the skin barrier. Ideal for irritated or compromised skin. Suits dry and sensitive skin.',
    badges: [],
    categoryIds: [referenceIds.categories.faceCare],
    productFamilyIds: [referenceIds.productFamilies.moisturizer],
    collectionIds: [referenceIds.collections.skincare],
    variants: [
      { label: '100ml', price: 48.0 },
      { label: '242ml', price: 60.0 },
    ],
    inStock: true,
    image: 'barrier-repair-cream.jpg',
  },
  {
    name: 'Brightening Eye Serum',
    description:
      'Targeted eye care serum to reduce dark circles and fine lines. Precision roller ball applicator.',
    badges: [],
    categoryIds: [referenceIds.categories.serumsAndOils],
    productFamilyIds: [referenceIds.productFamilies.serum],
    collectionIds: [referenceIds.collections.skincare],
    variants: [
      { label: '15ml', price: 44.0 },
      { label: '30ml', price: 55.0 },
    ],
    inStock: true,
    image: 'brightening-eye-serum.jpg',
  },
  {
    name: 'Retinol Night Serum',
    description:
      'Powerful night treatment with retinol complex. Anti-aging formula for cell renewal and skin texture improvement. Suits oily skin.',
    badges: [],
    categoryIds: [referenceIds.categories.serumsAndOils],
    productFamilyIds: [referenceIds.productFamilies.serum],
    collectionIds: [referenceIds.collections.skincare],
    variants: [{ label: '30ml', price: 72.0 }],
    inStock: true,
    image: 'retinol-night-serum.jpg',
  },
  {
    name: 'Hydrating Face Mist',
    description:
      'Refreshing hydrating mist for instant skin hydration. Perfect for on-the-go moisture boost throughout the day.',
    badges: [],
    categoryIds: [referenceIds.categories.faceCare],
    productFamilyIds: [referenceIds.productFamilies.moisturizer],
    collectionIds: [referenceIds.collections.skincare],
    variants: [{ label: '100ml', price: 38.0 }],
    inStock: true,
    image: 'hydrating-face-mist.jpg',
  },
  {
    name: 'Luminous Face Serum',
    description:
      "Iridescent-finish serum that adds a luminous glow to the skin. Enhances natural radiance with light-reflecting particles. The glow you want the morning of your sister's wedding.",
    badges: [],
    categoryIds: [referenceIds.categories.faceCare, referenceIds.categories.serumsAndOils],
    productFamilyIds: [referenceIds.productFamilies.serum],
    collectionIds: [referenceIds.collections.skincare],
    variants: [{ label: '30ml', price: 68.0 }],
    inStock: true,
    image: 'luminous-face-serum.jpg',
  },
  {
    name: 'Deep Hydration Mask',
    description:
      'Intensive hydrating mask for weekly treatment. Restores moisture balance and plumps the skin. Suits dry and sensitive skin.',
    badges: [],
    categoryIds: [referenceIds.categories.faceCare],
    productFamilyIds: [referenceIds.productFamilies.mask],
    collectionIds: [referenceIds.collections.skincare],
    variants: [{ label: '75ml', price: 55.0 }],
    inStock: true,
    image: 'deep-hydration-mask.jpg',
  },
  {
    name: 'Firming Neck Serum',
    description:
      'Specialized neck serum to target fine lines and loss of elasticity. Precision roller ball applicator for targeted application. Roll it on with the same steady pressure a good shiatsu session leaves behind.',
    badges: [],
    categoryIds: [referenceIds.categories.faceCare, referenceIds.categories.serumsAndOils],
    productFamilyIds: [referenceIds.productFamilies.serum],
    collectionIds: [referenceIds.collections.skincare],
    variants: [{ label: '20ml', price: 52.0 }],
    inStock: true,
    image: 'firming-neck-serum.jpg',
  },
  {
    name: 'Nourishing Body Oil',
    description:
      'Rich body oil for deep nourishment and hydration. Contains botanical extracts for soft, silky skin.',
    badges: [],
    categoryIds: [referenceIds.categories.bodyCare],
    productFamilyIds: [referenceIds.productFamilies.bodyOil],
    collectionIds: [referenceIds.collections.skincare],
    variants: [{ label: '100ml', price: 46.0 }],
    inStock: true,
    image: 'nourishing-body-oil.jpg',
  },
  {
    name: 'Gentle Cleansing Oil',
    description:
      'Lightweight oil cleanser for effective makeup and impurity removal. Gentle on sensitive skin.',
    badges: [],
    categoryIds: [referenceIds.categories.faceCare],
    productFamilyIds: [referenceIds.productFamilies.cleanser],
    collectionIds: [referenceIds.collections.skincare],
    variants: [{ label: '150ml', price: 42.0 }],
    inStock: true,
    image: 'gentle-cleansing-oil.jpg',
  },
  {
    name: 'Protective Sunscreen SPF50',
    description:
      'Broad-spectrum UV protection with SPF50. Lightweight formula that does not leave a white cast. Built for grey coastal mornings, festival afternoons and golden desert sunsets alike.',
    badges: [],
    categoryIds: [referenceIds.categories.faceCare],
    productFamilyIds: [referenceIds.productFamilies.moisturizer],
    collectionIds: [referenceIds.collections.skincare],
    variants: [{ label: '50ml', price: 58.0 }],
    inStock: true,
    image: 'protective-sunscreen.jpg',
  },
  {
    name: 'Intensive Night Cream',
    description:
      'Rich night cream for overnight restoration and repair. Infused with nourishing botanical oils and peptides. Suits dry and sensitive skin. Ideal after a long day exploring where the sun never reaches.',
    badges: [],
    categoryIds: [referenceIds.categories.faceCare],
    productFamilyIds: [referenceIds.productFamilies.moisturizer],
    collectionIds: [referenceIds.collections.skincare],
    variants: [{ label: '50ml', price: 72.0 }],
    inStock: true,
    image: 'intensive-night-cream.jpg',
  },
  {
    name: 'Hydrating Toner Essence',
    description:
      "Lightweight toner essence for hydration and prep. Enhances skin's ability to absorb following treatments.",
    badges: [],
    categoryIds: [referenceIds.categories.faceCare],
    productFamilyIds: [referenceIds.productFamilies.moisturizer],
    collectionIds: [referenceIds.collections.skincare],
    variants: [{ label: '120ml', price: 48.0 }],
    inStock: true,
    image: 'hydrating-toner-essence.jpg',
  },
  {
    name: 'Nourishing Hand Cream',
    description:
      "Rich hand cream for soft and moisturized hands. Fast-absorbing formula with natural botanicals. Absorbs quickly, so your golden retriever won't mind the extra cuddles.",
    badges: [],
    categoryIds: [referenceIds.categories.bodyCare],
    productFamilyIds: [referenceIds.productFamilies.handCream],
    collectionIds: [referenceIds.collections.skincare],
    variants: [{ label: '75ml', price: 34.0 }],
    inStock: true,
    image: 'nourishing-hand-cream.jpg',
  },
];

interface AdminProductSummary {
  id: string;
  slug: string;
}

const FIND_PRODUCTS = `
  query ($filter: ProductsFilterInput) {
    adminProducts(filter: $filter, pagination: { page: 1, limit: 20 }) {
      items { id slug }
    }
  }
`;

const CREATE_PRODUCT = `
  mutation ($input: AdminCreateProductInput!) {
    adminCreateProduct(input: $input) { id }
  }
`;

const ADD_VARIANT = `
  mutation ($productId: String!, $input: AdminCreateProductVariantInput!) {
    adminAddProductVariant(productId: $productId, input: $input) { id }
  }
`;

const ACTIVATE_PRODUCT = `
  mutation ($id: String!, $input: AdminUpdateProductInput!) {
    adminUpdateProduct(id: $id, input: $input) { id }
  }
`;

async function findExistingProductId(name: string, adminToken: string): Promise<string | null> {
  const slug = slugify(name);
  const { adminProducts } = await gql<{ adminProducts: { items: AdminProductSummary[] } }>(
    FIND_PRODUCTS,
    { filter: { search: name } },
    adminToken,
  );

  return adminProducts.items.find((item) => item.slug === slug)?.id ?? null;
}

async function createProduct(product: DemoProduct, adminToken: string): Promise<string> {
  const { adminCreateProduct } = await gql<{ adminCreateProduct: { id: string } }>(
    CREATE_PRODUCT,
    {
      input: {
        name: product.name,
        description: product.description,
        badges: product.badges,
        categoryIds: product.categoryIds,
        productFamilyIds: product.productFamilyIds,
        collectionIds: product.collectionIds,
      },
    },
    adminToken,
  );

  const productId = adminCreateProduct.id;

  for (const variant of product.variants) {
    await gql(
      ADD_VARIANT,
      {
        productId,
        input: {
          label: variant.label,
          price: variant.price,
          isOnSale: variant.isOnSale ?? false,
          discountPercentage: variant.discountPercentage ?? 0,
        },
      },
      adminToken,
    );
  }

  if (product.inStock) {
    await gql(ACTIVATE_PRODUCT, { id: productId, input: { isActive: true } }, adminToken);
  }

  const content = await readFile(path.join(PRODUCTS_DIR, product.image));
  await uploadFile(
    `/v1/admin/products/${productId}/images`,
    { content, filename: product.image, mimeType: 'image/jpeg' },
    adminToken,
  );

  return productId;
}

export type DemoProductIds = ReadonlyMap<string, string>;

export async function seedDemoProducts(adminToken: string): Promise<DemoProductIds> {
  const ids = new Map<string, string>();
  let created = 0;

  for (const product of products) {
    const existingId = await findExistingProductId(product.name, adminToken);

    if (existingId) {
      ids.set(product.name, existingId);
      continue;
    }

    const productId = await createProduct(product, adminToken);
    ids.set(product.name, productId);
    created += 1;
  }

  process.stdout.write(`Demo products ready (${created} created, ${products.length} total)\n`);
  return ids;
}
