import { gql } from '@apollo/client';

export const GET_WISHLIST = gql`
  query GetWishlist {
    wishlist {
      id
      slug
      name
      description
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
`;

export const REMOVE_FROM_WISHLIST = gql`
  mutation RemoveWishlistItem($input: WishlistItemInput!) {
    removeWishlistItem(input: $input)
  }
`;
