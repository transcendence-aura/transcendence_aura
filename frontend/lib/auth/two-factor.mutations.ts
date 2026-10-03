import { gql, type TypedDocumentNode } from '@apollo/client';

export interface DisableTwoFactorMutationData {
  disableTwoFactor: {
    enabled: boolean;
  };
}

export interface DisableTwoFactorMutationVariables {
  input: {
    code: string;
  };
}

export const SETUP_TWO_FACTOR_MUTATION = gql`
  mutation SetupTwoFactor {
    setupTwoFactor {
      provisioningUri
      qrCode
    }
  }
`;

export const CONFIRM_TWO_FACTOR_MUTATION = gql`
  mutation ConfirmTwoFactor($input: ConfirmTwoFactorInput!) {
    confirmTwoFactor(input: $input) {
      enabled
    }
  }
`;

export const VERIFY_MFA_MUTATION = gql`
  mutation VerifyMfa($input: VerifyMfaInput!) {
    verifyMfa(input: $input) {
      accessToken
      expiresIn
    }
  }
`;

export const DISABLE_TWO_FACTOR_MUTATION: TypedDocumentNode<
  DisableTwoFactorMutationData,
  DisableTwoFactorMutationVariables
> = gql`
  mutation DisableTwoFactor($input: DisableTwoFactorInput!) {
    disableTwoFactor(input: $input) {
      enabled
    }
  }
`;
