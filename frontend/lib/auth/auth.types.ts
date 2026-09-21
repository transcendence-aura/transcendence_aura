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

export type LoginMutationData = {
  login: LoginResponse;
};

export type LoginMutationVariables = {
  input: LoginCredentials;
};

export type RegisterMutationData = {
  register: {
    id: string;
    email: string;
    name: string;
  };
};

export type RegisterMutationVariables = {
  input: LoginCredentials & { name: string };
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
