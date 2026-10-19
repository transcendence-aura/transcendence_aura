import { gql } from '@apollo/client';
import { ProductMedia, ProductVariant } from './products';

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  badges: string[];
  primaryImage?: ProductMedia;
  media: ProductMedia[];
  variants: ProductVariant[];
  categories: ProductCategory[];
}

export interface ProductQueryResponse {
  product: Product;
}

export const PRODUCT_QUERY = gql`
  query GetProduct($slug: String!) {
    product(slug: $slug) {
      id
      slug
      name
      description
      badges
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
      categories {
        id
        name
        slug
      }
    }
  }
`;
