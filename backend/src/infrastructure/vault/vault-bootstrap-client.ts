import { RequiredSecrets, validateSecrets } from '../../config/required-secrets';
import { VaultBootstrapConfig } from './vault-bootstrap-config';

interface VaultAppRoleLoginResponse {
  auth?: {
    client_token?: string;
    lease_duration?: number;
    renewable?: boolean;
  };
}

interface VaultKvV2Response {
  data?: {
    data?: unknown;
    metadata?: {
      version?: number;
    };
  };
}

export class VaultBootstrapClient {
  constructor(private readonly config: VaultBootstrapConfig) {}
  async loadRequiredSecrets(): Promise<RequiredSecrets> {
    const token = await this.authenticate();

    try {
      const rawSecret = await this.readKvV2Secret(token);
      return validateSecrets(rawSecret);
    } finally {
      await this.revokeToken(token).catch(() => {});
    }
  }

  private async authenticate(): Promise<string> {
    const url = `${this.config.address}/v1/auth/` + `${encodePath(this.config.authPath)}/login`;

    const response = await this.requestJson<VaultAppRoleLoginResponse>({
      operation: 'Vault AppRole authentication',
      url,
      method: 'POST',
      headers: this.baseHeaders(),
      body: {
        role_id: this.config.roleId,
        secret_id: this.config.secretId,
      },
    });

    const token = response.auth?.client_token;

    if (!token) {
      throw new Error('Vault AppRole authentication succeeded without returning a client token');
    }
    return token;
  }

  private async readKvV2Secret(token: string): Promise<unknown> {
    const url =
      `${this.config.address}/v1/` +
      `${encodePath(this.config.kvMount)}/data/` +
      encodePath(this.config.secretPath);

    const response = await this.requestJson<VaultKvV2Response>({
      operation: 'Vault KV secret read',
      url,
      method: 'GET',
      headers: {
        ...this.baseHeaders(),
        'X-Vault-Token': token,
      },
    });

    const secret = response.data?.data;

    if (!secret || typeof secret !== 'object' || Array.isArray(secret)) {
      throw new Error('Vault KV response did not contain a valid secret object');
    }
    return secret;
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

  private async requestJson<T>(options: {
    operation: string;
    url: string;
    method: 'GET' | 'POST';
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
        throw new Error(`${options.operation} failed with HTTP status ${response.status}`);
      }

      let body: unknown;

      try {
        body = await response.json();
      } catch {
        throw new Error(`${options.operation} returned an invalid JSON response`);
      }

      return body as T;
    } catch (error: unknown) {
      if (isAbortError(error)) {
        throw new Error(`${options.operation} timed out after ${this.config.requestTimeoutMs} ms`);
      }

      if (error instanceof Error) {
        if (error.message.startsWith(options.operation) || error.message.startsWith('Vault ')) {
          throw error;
        }
      }
      throw new Error(`${options.operation} failed due to a network error`, { cause: error });
    } finally {
      clearTimeout(timeout);
    }
  }

  private async revokeToken(token: string): Promise<void> {
    await this.requestJson<unknown>({
      operation: 'Vault token revocation',
      url: `${this.config.address}/v1/auth/token/revoke-self`,
      method: 'POST',
      headers: {
        ...this.baseHeaders(),
        'X-Vault-Token': token,
      },
    });
  }
}

function encodePath(path: string): string {
  return path.split('/').filter(Boolean).map(encodeURIComponent).join('/');
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}
