export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginResponse =
  | {
      requiresMfa: false;
      accessToken: string;
      expiresIn: number;
    }
  | {
      requiresMfa: true;
      mfaPendingToken: string;
      expiresIn: number;
    };

export type VerifyMfaResponse = {
  accessToken: string;
  expiresIn: number;
};

export type VerifyMfaMutationData = {
  verifyMfa: VerifyMfaResponse;
};

export type VerifyMfaMutationVariables = {
  input: {
    mfaPendingToken: string;
    code: string;
  };
};
