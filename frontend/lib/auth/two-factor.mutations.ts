import { gql } from '@apollo/client';

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
