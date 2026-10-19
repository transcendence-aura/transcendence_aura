import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';

export interface CartItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
  };
  variant: {
    id: string;
    label: string;
    price: number;
  };
  quantity: number;
}

export interface CartQueryResponse {
  cart: {
    id: string;
    items: CartItem[];
    subtotal: number;
    tax: number;
    total: number;
  };
}

export const GET_CART: TypedDocumentNode<CartQueryResponse> = gql`
  query GetCart {
    cart {
      id
      items {
        id
        productId
        product {
          id
          name
          slug
        }
        variant {
          id
          label
          price
        }
        quantity
      }
      subtotal
      tax
      total
    }
  }
`;
