import { gql } from '@apollo/client';

export interface ProductMedia {
  id: string;
  url: string;
  altText: string | null;
  position: number;
}

export interface ProductVariant {
  id: string;
  label: string;
  isAvailable: boolean;
  price: number;
  isOnSale: boolean;
  discountPercentage: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  badges: string[];
  media: ProductMedia[];
  variants: ProductVariant[];
}

export interface ProductsQueryResponse {
  products: {
    items: Product[];
    total: number;
    hasNextPage: boolean;
  };
}

export const PRODUCTS_QUERY = gql`
  query GetProducts($filter: ProductsFilterInput, $pagination: ProductPaginationInput) {
    products(filter: $filter, pagination: $pagination) {
      items {
        id
        slug
        name
        description
        badges
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
      total
      hasNextPage
    }
  }
`;
