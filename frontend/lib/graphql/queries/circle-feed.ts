import { gql, type TypedDocumentNode } from '@apollo/client';

export type CircleFeedActivityKind = 'NEW_FOLLOW' | 'WISHLIST_ITEM_ADDED';

export interface CircleFeedProfile {
  id: string;
  name: string;
  handle: string;
}

export interface CircleFeedProductMedia {
  id: string;
  url: string;
  altText?: string;
  position: number;
}

export interface CircleFeedProductVariant {
  id: string;
  label: string;
  isAvailable: boolean;
  price: number;
  isOnSale: boolean;
  discountPercentage: number;
}

export interface CircleFeedProduct {
  id: string;
  slug: string;
  name: string;
  description?: string;
  media: CircleFeedProductMedia[];
  variants: CircleFeedProductVariant[];
  primaryImage?: CircleFeedProductMedia;
  minPrice?: number;
  badges: string[];
}

export interface CircleFeedItem {
  id: string;
  type: CircleFeedActivityKind;
  actor: CircleFeedProfile;
  createdAt: string;
  followedUser?: CircleFeedProfile;
  product?: CircleFeedProduct;
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
          id
          slug
          name
          description
          badges
          minPrice
          primaryImage {
            id
            url
            altText
            position
          }
          media {
            id
            url
            altText
            position
          }
          variants {
            id
            label
            isAvailable
            price
            isOnSale
            discountPercentage
          }
        }
      }
      total
      hasNextPage
    }
  }
`;
