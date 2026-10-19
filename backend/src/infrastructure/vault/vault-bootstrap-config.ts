import { readFile } from 'node:fs/promises';

export interface VaultBootstrapConfig {
  address: string;
  roleId: string;
  secretId: string;
  secretPath: string;
  kvMount: string;
  authPath: string;
  namespace?: string;
  requestTimeoutMs: number;
}

export async function loadVaultConfig(
  environment: NodeJS.ProcessEnv = process.env,
): Promise<VaultBootstrapConfig> {
  const address = parseVaultAddress(
    requireEnv(environment, 'VAULT_ADDR'),
    environment.NODE_ENV === 'production',
  );
  const roleId = requireEnv(environment, 'VAULT_ROLE_ID');
  const secretIdFile = requireEnv(environment, 'VAULT_SECRET_ID_FILE');
  const secretPath = requireEnv(environment, 'VAULT_SECRET_PATH');

  const requestTimeoutMs = parsePositiveInteger(
    environment.VAULT_REQUEST_TIMEOUT_MS ?? '10000',
    'VAULT_REQUEST_TIMEOUT_MS',
    60_000,
  );
  let secretId: string;

  try {
    secretId = (await readFile(secretIdFile, 'utf8')).trim();
  } catch {
    throw new Error('Unable to read the Vault SecretID file.');
  }

  if (secretId.length === 0) {
    throw new Error('The Vault SecretID file is empty.');
  }

  return {
    address,
    roleId,
    secretId,
    secretPath: normalizeVaultPath(secretPath),
    kvMount: normalizeVaultPath(environment.VAULT_KV_MOUNT ?? 'secret'),
    authPath: normalizeVaultPath(environment.VAULT_AUTH_PATH ?? 'approle'),
    namespace: optionalNonEmpty(environment.VAULT_NAMESPACE),
    requestTimeoutMs,
  };
}

function requireEnv(environment: NodeJS.ProcessEnv, name: string): string {
  const value = environment[name]?.trim();

  if (!value) {
    throw new Error(`Invalid Vault configuration: ${name} is required`);
  }
  return value;
}

function optionalNonEmpty(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function parseVaultAddress(value: string, isProduction: boolean): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid Vault configuration: VAULT_ADDR must be a valid URL`);
  }

  if (isProduction) {
    if (url.protocol !== 'https:') {
      throw new Error('Invalid Vault configuration: VAULT_ADDR must use HTTPS in production');
    }
  } else if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Invalid Vault configuration: VAULT_ADDR must use HTTP or HTTPS');
  }

  if (url.username || url.password) {
    throw new Error('Invalid Vault configurations: VAULT_ADDR must not contain credentials');
  }

  if (url.search || url.hash) {
    throw new Error('Invalid Vault configuration: VAULT_ADDR must not contain a query or fragment');
  }

  if (url.pathname !== '/' && url.pathname !== '') {
    throw new Error('Invalid Vault configuration: VAULT_ADDR must not contain a path');
  }

  return url.origin;
}

function parsePositiveInteger(value: string, fieldName: string, maximum: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > maximum) {
    throw new Error(
      `Invalid Vault configuration: ${fieldName} must be an integer between 1 and ${maximum}`,
    );
  }
  return parsed;
}

function normalizeVaultPath(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/g, '');
  if (!normalized) {
    throw new Error('Invalid Vault configuration: Vault path cannot be empty');
  }
  return normalized;
}
