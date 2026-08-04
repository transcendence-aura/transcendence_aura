import { RequiredSecrets } from './required-secrets';

export interface AppConfiguration {
  database: {
    url: string;
  };
  jwt: {
    accessSecret: string;
    refreshSecret: string;
  };
  redis: {
    url: string;
  };
  oauth: {
    clientId: string;
    clientSecret: string;
  };
}

export function createAppConfig(secrets: RequiredSecrets): AppConfiguration {
  return {
    database: {
      url: secrets.POSTGRES_URL,
    },
    jwt: {
      accessSecret: secrets.JWT_ACCESS_SECRET,
      refreshSecret: secrets.JWT_REFRESH_SECRET,
    },
    redis: {
      url: secrets.REDIS_URL,
    },
    oauth: {
      clientId: secrets.OAUTH_CLIENT_ID,
      clientSecret: secrets.OAUTH_CLIENT_SECRET,
    },
  };
}
