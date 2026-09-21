import { gql, type TypedDocumentNode } from '@apollo/client';

export interface MeQueryData {
  me: {
    id: string;
    name: string;
    email: string;
    handle: string;
    bio: string | null;
  };
}

export const ME_QUERY: TypedDocumentNode<MeQueryData> = gql`
  query Me {
    me {
      id
      name
      email
      handle
      bio
    }
  }
`;
