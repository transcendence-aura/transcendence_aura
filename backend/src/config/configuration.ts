import { RequiredSecrets } from './required-secrets';

export interface AppConfiguration {
  database: {
    url: string;
  };
  jwt: {
    accessSecret: string;
    accessTokenTtl: number;
    mfaPendingTokenTtl: number;
    issuer: string;
    accessAudience: string;
    mfaPendingAudience: string;
  };
  auth: {
    refreshTokenTtl: number;
  };
}

export function createAppConfig(secrets: RequiredSecrets): AppConfiguration {
  return {
    database: {
      url: secrets.POSTGRES_URL,
    },
    jwt: {
      accessSecret: secrets.JWT_ACCESS_SECRET,
      accessTokenTtl: 15 * 60,
      mfaPendingTokenTtl: 5 * 60,
      issuer: 'aura-backend',
      accessAudience: 'aura-web',
      mfaPendingAudience: 'aura-mfa',
    },
    auth: {
      refreshTokenTtl: 7 * 24 * 60 * 60,
    },
  };
}
