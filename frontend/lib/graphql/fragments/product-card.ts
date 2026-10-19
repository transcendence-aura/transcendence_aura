import { gql } from '@apollo/client';

// Shared by any query that renders a product through <ProductCard> - keeps
// the field list in sync instead of hand-copying it into each query file.
export interface ProductCardMedia {
  id: string;
  url: string;
  altText?: string;
  position: number;
}

export interface ProductCardVariant {
  id: string;
  label: string;
  isAvailable: boolean;
  price: number;
  isOnSale: boolean;
  discountPercentage: number;
}

export interface ProductCardProduct {
  id: string;
  slug: string;
  name: string;
  description?: string;
  media: ProductCardMedia[];
  variants: ProductCardVariant[];
  primaryImage?: ProductCardMedia;
  minPrice?: number;
  badges: string[];
}

export const PRODUCT_CARD_FIELDS = gql`
  fragment ProductCardFields on ProductType {
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
`;
