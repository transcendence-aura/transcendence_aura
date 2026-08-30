import { gql } from '@apollo/client';
import { ProductMedia, ProductVariant } from './products';

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ProductRating {
  average: number;
  count: number;
}

export interface ProductContent {
  description: string;
  keyIngredients: string;
  howToUse: string;
  shippingInfo: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  shortDescription: string;
  badges: string[];
  category: ProductCategory;
  rating: ProductRating;
  media: ProductMedia[];
  variants: ProductVariant[];
  content: ProductContent;
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
      shortDescription
      category {
        id
        name
        slug
      }
      badges
      rating {
        average
        count
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
      content {
        description
        keyIngredients
        howToUse
        shippingInfo
      }
    }
  }
`;
