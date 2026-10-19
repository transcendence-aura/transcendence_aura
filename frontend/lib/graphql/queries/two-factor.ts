import { gql, type TypedDocumentNode } from '@apollo/client';

export interface TwoFactorStatusQueryData {
  twoFactorStatus: {
    enabled: boolean;
  };
}

export const TWO_FACTOR_STATUS: TypedDocumentNode<TwoFactorStatusQueryData> = gql`
  query TwoFactorStatus {
    twoFactorStatus {
      enabled
    }
  }
`;
