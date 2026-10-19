const READY_TIMEOUT_MS = 90_000;
const READY_POLL_MS = 2_000;

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

export class GraphQLRequestError extends Error {}

function endpoint(): string {
  const url = process.env.SEED_GRAPHQL_URL;

  if (!url) {
    throw new Error('SEED_GRAPHQL_URL is not set');
  }

  return url;
}

export async function gql<T>(
  query: string,
  variables: Record<string, unknown> = {},
  accessToken?: string,
): Promise<T> {
  const response = await fetch(endpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  const body = (await response.json()) as GraphQLResponse<T>;

  if (body.errors?.length || !body.data) {
    const message = body.errors?.map((error) => error.message).join('; ') ?? response.statusText;
    throw new GraphQLRequestError(message);
  }

  return body.data;
}

export async function uploadFile(
  path: string,
  file: { content: Buffer; filename: string; mimeType: string },
  accessToken: string,
): Promise<void> {
  const form = new FormData();

  form.append(
    'file',
    new Blob([new Uint8Array(file.content)], { type: file.mimeType }),
    file.filename,
  );

  const response = await fetch(new URL(path, endpoint()), {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  if (!response.ok) {
    throw new GraphQLRequestError(
      `Upload to ${path} failed: ${response.status} ${await response.text()}`,
    );
  }
}

export async function waitForBackend(): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    try {
      await gql('{ __typename }');
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, READY_POLL_MS));
    }
  }

  throw new Error(`Backend did not answer on ${endpoint()} within ${READY_TIMEOUT_MS / 1000}s`);
}
