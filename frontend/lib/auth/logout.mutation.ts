import { gql, type TypedDocumentNode } from '@apollo/client';

export const LOGOUT_MUTATION: TypedDocumentNode<{ logout: boolean }> = gql`
  mutation Logout {
    logout
  }
`;
