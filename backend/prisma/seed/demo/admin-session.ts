import { gql } from './graphql';
import type { SeedConfig } from '../config';

const LOGIN = `
  mutation ($input: LoginInput!) {
    login(input: $input) { accessToken }
  }
`;

export async function loginAsAdmin(config: SeedConfig): Promise<string> {
  const { login } = await gql<{ login: { accessToken?: string } }>(LOGIN, {
    input: { email: config.adminEmail, password: config.adminPassword },
  });

  if (!login.accessToken) {
    throw new Error('Admin login did not return an access token');
  }

  return login.accessToken;
}
