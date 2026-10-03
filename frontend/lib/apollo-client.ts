import { ApolloClient, ApolloLink, InMemoryCache, HttpLink, Observable } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { getAccessToken } from './auth/token-store';
import { refreshAccessToken } from './auth/refresh-access-token';
import { CombinedGraphQLErrors } from '@apollo/client';

const httpLink = new HttpLink({
  // Same origin as the page (nginx), whatever host port it is published on.
  uri: '/graphql',
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

const errorLink = new ErrorLink(({ error, operation, forward }) => {
  const isUnauthenticated =
    CombinedGraphQLErrors.is(error) &&
    error.errors.some((graphQLError) => {
      const originalError = graphQLError.extensions?.originalError as
        { statusCode?: number } | undefined;
      return originalError?.statusCode === 401;
    });

  if (!isUnauthenticated) {
    return;
  }

  const alreadyRetried = operation.getContext().authRetried;

  if (alreadyRetried) {
    return;
  }

  operation.setContext({
    authRetried: true,
  });

  return new Observable((observer) => {
    let subscription: { unsubscribe(): void } | undefined;
    refreshAccessToken()
      .then((newAccessToken) => {
        if (!newAccessToken) {
          observer.error(error);
          return;
        }
        subscription = forward(operation).subscribe(observer);
      })
      .catch((refreshError) => {
        observer.error(refreshError);
      });
    return () => {
      subscription?.unsubscribe();
    };
  });
});

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});

export const getClient = () => apolloClient;
