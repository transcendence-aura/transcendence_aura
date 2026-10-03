import { gql, type TypedDocumentNode } from '@apollo/client';

export interface Collection {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  heroImageUrl: string;
}

export interface CollectionsQueryResponse {
  collections: Collection[];
}

export const GET_COLLECTIONS: TypedDocumentNode<CollectionsQueryResponse> = gql`
  query GetCollections {
    collections {
      id
      slug
      name
      description
      heroImageUrl
    }
  }
`;
