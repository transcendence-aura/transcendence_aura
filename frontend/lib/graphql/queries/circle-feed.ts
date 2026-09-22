import { gql, type TypedDocumentNode } from '@apollo/client';
import { PRODUCT_CARD_FIELDS, type ProductCardProduct } from '../fragments/product-card';

export type CircleFeedActivityKind = 'NEW_FOLLOW' | 'WISHLIST_ITEM_ADDED';

export interface CircleFeedProfile {
  id: string;
  name: string;
  handle: string;
}

export interface CircleFeedItem {
  id: string;
  type: CircleFeedActivityKind;
  actor: CircleFeedProfile;
  createdAt: string;
  followedUser?: CircleFeedProfile;
  product?: ProductCardProduct;
}

export interface CircleFeedPage {
  items: CircleFeedItem[];
  total: number;
  hasNextPage: boolean;
}

export interface CircleFeedQueryData {
  circleFeed: CircleFeedPage;
}

export const CIRCLE_FEED_QUERY: TypedDocumentNode<CircleFeedQueryData> = gql`
  query CircleFeed {
    circleFeed {
      items {
        id
        type
        createdAt
        actor {
          id
          name
          handle
        }
        followedUser {
          id
          name
          handle
        }
        product {
          ...ProductCardFields
        }
      }
      total
      hasNextPage
    }
  }
  ${PRODUCT_CARD_FIELDS}
`;
