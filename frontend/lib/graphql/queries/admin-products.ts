import { gql } from '@apollo/client';

export interface ProductMedia {
  id: string;
  url: string;
  altText: string | null;
  position: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: string;
  label: string;
  isAvailable: boolean;
  price: number;
  isOnSale: boolean;
  discountPercentage: number;
}

export interface ProductCategory {
  id: string;
  slug: string;
  name: string;
}

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  description: string | null;
  badges: string[];
  minPrice: number | null;
  primaryImage: ProductMedia | null;
  media: ProductMedia[];
  variants: ProductVariant[];
  categories: ProductCategory[];
}

export interface AdminProductsPage {
  items: AdminProduct[];
  total: number;
  hasNextPage: boolean;
}

export interface AdminProductsQueryResponse {
  adminProducts: AdminProductsPage;
}

export interface PublishedProductsCountResponse {
  products: { total: number };
}

export interface AdminCategory {
  id: string;
  slug: string;
  name: string;
}

export interface AdminCreateProductResponse {
  adminCreateProduct: AdminProduct;
}

export interface AdminUpdateProductResponse {
  adminUpdateProduct: AdminProduct;
}

export interface AdminDeactivateProductResponse {
  adminDeleteProduct: AdminProduct;
}

export interface AdminAddProductVariantResponse {
  adminAddProductVariant: ProductVariant;
}

export interface AdminSetPrimaryProductImageResponse {
  adminSetPrimaryProductImage: AdminProduct;
}

export interface AdminDeleteProductImageResponse {
  adminDeleteProductImage: AdminProduct;
}

export interface AdminCategoriesQueryResponse {
  adminCategories: AdminCategory[];
}

const PRODUCT_FIELDS = `
  id
  slug
  name
  isActive
  description
  badges
  minPrice
  primaryImage {
    id
    url
    altText
    position
    isPrimary
  }
  media {
    id
    url
    altText
    position
    isPrimary
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
    slug
    name
  }
`;

export const GET_ADMIN_PRODUCTS = gql`
  query AdminProductsList($filter: ProductsFilterInput, $pagination: ProductPaginationInput) {
    adminProducts(filter: $filter, pagination: $pagination) {
      items {
        ${PRODUCT_FIELDS}
      }
      total
      hasNextPage
    }
  }
`;

// Hits the public products() query (unlike adminProducts, this one still
// filters isActive: true) purely to read its total - used to show how many
// products are actually published/live, independent of the admin's own
// draft-inclusive listing and current category/search filter.
export const GET_PUBLISHED_PRODUCTS_COUNT = gql`
  query PublishedProductsCount {
    products(pagination: { page: 1, limit: 1 }) {
      total
    }
  }
`;

export const GET_ADMIN_CATEGORIES = gql`
  query AdminCategoriesList {
    adminCategories {
      id
      slug
      name
    }
  }
`;

export const ADMIN_CREATE_PRODUCT = gql`
  mutation AdminCreateProduct($input: AdminCreateProductInput!) {
    adminCreateProduct(input: $input) {
      ${PRODUCT_FIELDS}
    }
  }
`;

export const ADMIN_UPDATE_PRODUCT = gql`
  mutation AdminUpdateProduct($id: String!, $input: AdminUpdateProductInput!) {
    adminUpdateProduct(id: $id, input: $input) {
      ${PRODUCT_FIELDS}
    }
  }
`;

export const ADMIN_DELETE_PRODUCT = gql`
  mutation AdminDeleteProduct($id: String!) {
    adminDeleteProduct(id: $id) {
      ${PRODUCT_FIELDS}
    }
  }
`;

export const ADMIN_HARD_DELETE_PRODUCT = gql`
  mutation AdminHardDeleteProduct($id: String!) {
    adminHardDeleteProduct(id: $id)
  }
`;

export const ADMIN_ADD_PRODUCT_VARIANT = gql`
  mutation AdminAddProductVariant($productId: String!, $input: AdminCreateProductVariantInput!) {
    adminAddProductVariant(productId: $productId, input: $input) {
      id
      label
      isAvailable
      price
      isOnSale
      discountPercentage
    }
  }
`;

export const ADMIN_UPDATE_PRODUCT_VARIANT = gql`
  mutation AdminUpdateProductVariant($variantId: String!, $input: AdminUpdateProductVariantInput!) {
    adminUpdateProductVariant(variantId: $variantId, input: $input) {
      id
      label
      isAvailable
      price
      isOnSale
      discountPercentage
    }
  }
`;

export const ADMIN_DELETE_PRODUCT_VARIANT = gql`
  mutation AdminDeleteProductVariant($variantId: String!) {
    adminDeleteProductVariant(variantId: $variantId)
  }
`;

export const ADMIN_SET_PRIMARY_PRODUCT_IMAGE = gql`
  mutation AdminSetPrimaryProductImage($productId: String!, $imageId: String!) {
    adminSetPrimaryProductImage(productId: $productId, imageId: $imageId) {
      ${PRODUCT_FIELDS}
    }
  }
`;

export const ADMIN_REORDER_PRODUCT_IMAGES = gql`
  mutation AdminReorderProductImages($productId: String!, $input: AdminReorderProductImagesInput!) {
    adminReorderProductImages(productId: $productId, input: $input) {
      ${PRODUCT_FIELDS}
    }
  }
`;

export const ADMIN_DELETE_PRODUCT_IMAGE = gql`
  mutation AdminDeleteProductImage($productId: String!, $imageId: String!) {
    adminDeleteProductImage(productId: $productId, imageId: $imageId) {
      ${PRODUCT_FIELDS}
    }
  }
`;
