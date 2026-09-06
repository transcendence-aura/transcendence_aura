import { clearAccessToken, setAccessToken } from "./token-store";

let refreshPromise: Promise<string | null> | null = null;

interface RefreshMutationResponse {
  data?: {
    refresh?: {
      accessToken: string;
    };
  };
  errors?: Array<{
    message: string;
  }>;
}

export function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = performRefresh().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function performRefresh(): Promise<string | null> {
  try {
    const response = await fetch('https://localhost/graphql',{
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          mutation Refresh {
            refresh {
              accessToken
            }
          }
          `,
      }),
    });
    if (!response.ok) {
      clearAccessToken();
      return null;
    }
    const result = (await response.json()) as RefreshMutationResponse;

    const accessToken = result.data?.refresh?.accessToken;

    if (!accessToken || result.errors?.length) {
      clearAccessToken();
      return null;
    }
    setAccessToken(accessToken);
    return accessToken;
  } catch {
    clearAccessToken();
    return null;
  }
}
