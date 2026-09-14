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
