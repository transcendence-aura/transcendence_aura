export interface RequiredSecrets {
  POSTGRES_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  REDIS_URL: string;
  OAUTH_CLIENT_ID: string;
  OAUTH_CLIENT_SECRET: string;
  TWO_FACTOR_ENCRYPTION: string;
}

const REQUIRED_VAULT_SECRETS = [
  'POSTGRES_URL',
  'JWT_ACCESS_SECRET',
  'REDIS_URL',
  'TWO_FACTOR_ENCRYPTION',
] as const satisfies readonly (keyof RequiredSecrets)[];

export function validateSecrets(value: unknown): RequiredSecrets {
  if (!isPlainObject(value)) {
    throw new Error('Vault secret validation failed. Expected a secret object.');
  }

  const errors: string[] = [];

  for (const name of REQUIRED_VAULT_SECRETS) {
    const secret = value[name];
    if (typeof secret !== 'string' || secret.trim().length === 0) {
      errors.push(`${name}: required non-empty string`);
    }
  }

  if (typeof value.POSTGRES_URL === 'string') {
    validateUrl(value.POSTGRES_URL, ['postgresql:', 'postgres:'], 'POSTGRES_URL', errors);
  }

  if (typeof value.REDIS_URL === 'string') {
    validateUrl(value.REDIS_URL, ['redis:', 'rediss:'], 'REDIS_URL', errors);
  }

  if (typeof value.JWT_ACCESS_SECRET === 'string' && value.JWT_ACCESS_SECRET.length < 32) {
    errors.push('JWT_ACCESS_SECRET must contain at least 32 characters');
  }

  if (typeof value.JWT_REFRESH_SECRET === 'string' && value.JWT_REFRESH_SECRET.length < 32) {
    errors.push('JWT_REFRESH_SECRET must contain at least 32 characters');
  }

  if (
    typeof value.JWT_ACCESS_SECRET === 'string' &&
    typeof value.JWT_REFRESH_SECRET === 'string' &&
    value.JWT_ACCESS_SECRET === value.JWT_REFRESH_SECRET
  ) {
    errors.push('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different.');
  }

  if (errors.length > 0) {
    throw new Error(`Vault secret validation failed: ${errors.join('; ')}`);
  }

  return {
    POSTGRES_URL: value.POSTGRES_URL as string,
    JWT_ACCESS_SECRET: value.JWT_ACCESS_SECRET as string,
    JWT_REFRESH_SECRET: value.JWT_REFRESH_SECRET as string,
    REDIS_URL: value.REDIS_URL as string,
    OAUTH_CLIENT_ID: value.OAUTH_CLIENT_ID as string,
    OAUTH_CLIENT_SECRET: value.OAUTH_CLIENT_SECRET as string,
    TWO_FACTOR_ENCRYPTION: value.TWO_FACTOR_ENCRYPTION as string,
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateUrl(
  value: string,
  allowedProtocols: readonly string[],
  fieldName: string,
  errors: string[],
): void {
  try {
    const url = new URL(value);
    if (!allowedProtocols.includes(url.protocol)) {
      errors.push(`${fieldName}: unsupported URL protocol`);
    }

    if (!url.hostname) {
      errors.push(`${fieldName}: hostname is required`);
    }
  } catch {
    errors.push(`${fieldName}: invalid URL`);
  }
}
