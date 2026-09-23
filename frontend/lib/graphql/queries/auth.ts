import { gql, type TypedDocumentNode } from '@apollo/client';

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordData {
  changePassword: boolean;
}

export interface ChangePasswordVariables {
  input: ChangePasswordInput;
}

export const CHANGE_PASSWORD_MUTATION: TypedDocumentNode<
  ChangePasswordData,
  ChangePasswordVariables
> = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input)
  }
`;
