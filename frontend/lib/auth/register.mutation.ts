import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';
import type { RegisterMutationData, RegisterMutationVariables } from './auth.types';

export const REGISTER_MUTATION: TypedDocumentNode<RegisterMutationData, RegisterMutationVariables> =
  gql`
    mutation Register($input: RegisterDto!) {
      register(input: $input) {
        id
        email
        name
      }
    }
  `;
