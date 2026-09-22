import { gql } from './graphql';
import type { DemoProductIds } from './products';
import type { DemoSessions } from './users';

// user handle -> product names added to their wishlist
const wishlists: Readonly<Record<string, readonly string[]>> = {
  clara: ['Vitamin C Serum', 'Luminous Face Serum'],
  marielaurent: ['Barrier Repair Cream'],
  lena_s: ['Hydrating Face Mist'],
  phoenix_m: ['Retinol Night Serum'],
  trillian: ['Protective Sunscreen SPF50'],
  xavier_n: ['Intensive Night Cream', 'Nourishing Hand Cream'],
};

const ADD_WISHLIST_ITEM = `
  mutation ($input: WishlistItemInput!) {
    addWishlistItem(input: $input) { id }
  }
`;

export async function seedDemoWishlists(
  sessions: DemoSessions,
  productIds: DemoProductIds,
): Promise<void> {
  let count = 0;

  for (const [handle, productNames] of Object.entries(wishlists)) {
    const user = sessions.get(handle);

    if (!user) {
      throw new Error(`Unknown demo user "${handle}"`);
    }

    for (const productName of productNames) {
      const productId = productIds.get(productName);

      if (!productId) {
        throw new Error(`Unknown demo product "${productName}"`);
      }

      await gql(ADD_WISHLIST_ITEM, { input: { productId } }, user.accessToken);
      count += 1;
    }
  }

  process.stdout.write(`Demo wishlists ready (${count})\n`);
}
