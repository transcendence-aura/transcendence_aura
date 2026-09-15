import { VaultBootstrapConfig } from './vault-bootstrap-config';
import { VaultRequestError } from './vault-request.error';

interface VaultAppRoleLoginResponse {
  auth?: {
    client_token?: string;
    lease_duration?: number;
    renewable?: boolean;
  };
}

interface VaultKvV2Response {
  data?: {
    data?: Record<string, unknown>;
    metadata?: {
      version?: number;
    };
  };
}

export class VaultRuntimeClient {
  constructor(private readonly config: VaultBootstrapConfig) {}

  async writeSecret(path: string, data: Record<string, unknown>): Promise<void> {
    await this.withToken(async (token) => {
      await this.requestJson({
        operation: 'Vault KV secret write',
        url:
          `${this.config.address}/v1/` +
          `${encodePath(this.config.kvMount)}/data/` +
          encodePath(path),
        method: 'POST',
        headers: this.authHeaders(token),
        body: {
          data,
        },
      });
    });
  }

  async readKvV2Secret(path: string): Promise<Record<string, unknown> | null> {
    try {
      return this.withToken(async (token) => {
        const response = await this.requestJson<VaultKvV2Response>({
          operation: 'Vault KV secret read',
          url:
            `${this.config.address}/v1/` +
            `${encodePath(this.config.kvMount)}/data/` +
            encodePath(path),
          method: 'GET',
          headers: this.authHeaders(token),
        });

        return response.data?.data ?? null;
      });
    } catch (error) {
      if (error instanceof VaultRequestError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  private async withToken<T>(operation: (token: string) => Promise<T>): Promise<T> {
    const token = await this.authenticate();

    try {
      return await operation(token);
    } finally {
      await this.revokeToken(token).catch(() => {});
    }
  }

  private async authenticate(): Promise<string> {
    const response = await this.requestJson<VaultAppRoleLoginResponse>({
      operation: 'Vault AppRole authentication',
      url: `${this.config.address}/v1/auth/` + `${encodePath(this.config.authPath)}/login`,
      method: 'POST',
      headers: this.baseHeaders(),
      body: {
        role_id: this.config.roleId,
        secret_id: this.config.secretId,
      },
    });
    const token = response.auth?.client_token;

    if (!token) {
      throw new Error('Vault AppRole authentication succeeded without returning a client token.');
    }

    return token;
  }

  private async revokeToken(token: string): Promise<void> {
    await this.requestJson<unknown>({
      operation: 'Vault token revocation',
      url: `${this.config.address}/v1/auth/token/revoke-self`,
      method: 'POST',
      headers: this.authHeaders(token),
    });
  }

  private authHeaders(token: string): Record<string, string> {
    return {
      ...this.baseHeaders(),
      'X-Vault-Token': token,
    };
  }

  private baseHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    if (this.config.namespace) {
      headers['X-Vault-Namespace'] = this.config.namespace;
    }

    return headers;
  }

  private async requestJson<T = unknown>(options: {
    operation: string;
    url: string;
    method: 'GET' | 'POST' | 'DELETE';
    headers: Record<string, string>;
    body?: unknown;
  }): Promise<T> {
    const abortController = new AbortController();

    const timeout = setTimeout(() => abortController.abort(), this.config.requestTimeoutMs);

    try {
      const response = await fetch(options.url, {
        method: options.method,
        headers: options.headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: abortController.signal,
        redirect: 'error',
      });

      if (!response.ok) {
        throw new VaultRequestError(
          `${options.operation} failed with HTTP status ${response.status}`,
          response.status,
        );
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function encodePath(path: string): string {
  return path.split('/').filter(Boolean).map(encodeURIComponent).join('/');
}
