import 'server-only';
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { cookies } from 'next/headers';

export async function getServerApolloClient() {
  const cookieStore = await cookies();

  const accessToken = cookieStore.get('__Host-access_token')?.value;

  const httpLink = new HttpLink({
    uri: process.env.GRAPHQL_URL,
    headers: accessToken
      ? {
        authorization: `Bearer ${accessToken}`,
      }
      : {},
  });

  return new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
  });
}
