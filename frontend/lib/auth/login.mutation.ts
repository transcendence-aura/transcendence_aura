import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';
import type { LoginMutationData, LoginMutationVariables } from './auth.types';

export const LOGIN_MUTATION: TypedDocumentNode<LoginMutationData, LoginMutationVariables> = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      requiresMfa
      accessToken
      mfaPendingToken
      expiresIn
    }
  }
`;
