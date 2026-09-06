import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { getAccessToken } from './auth/token-store';

const httpLink = new HttpLink({
  uri: 'https://localhost/graphql',
  credentials: 'include',
});

const authLink = new SetContextLink((prevContext) => {
  const accessToken = getAccessToken();

  return {
    headers: {
      ...prevContext.headers,
      ...(accessToken
        ? {
          authorization: `Bearer ${accessToken}`,
        }
        : {}),
    },
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export const getClient = () => apolloClient;
