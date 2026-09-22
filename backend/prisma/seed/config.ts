export type SeedMode = 'empty' | 'demo';

export interface SeedConfig {
  mode: SeedMode;
  adminEmail: string;
  adminPassword: string;
  demoPassword: string;
}

const MIN_PASSWORD_LENGTH = 8;
const MODES: readonly SeedMode[] = ['empty', 'demo'];

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not set`);
  }

  return value;
}

function requirePassword(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set`);
  }

  if (value.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`${name} must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  return value;
}

function readMode(): SeedMode {
  const arg = process.argv.find((value) => value.startsWith('--mode='));
  const raw = arg ? arg.slice('--mode='.length) : process.env.SEED_MODE?.trim();

  if (!raw) {
    return 'empty';
  }

  if (!MODES.includes(raw as SeedMode)) {
    throw new Error(`SEED_MODE must be one of: ${MODES.join(', ')} (got "${raw}")`);
  }

  return raw as SeedMode;
}

export function readSeedConfig(): SeedConfig {
  const mode = readMode();

  return {
    mode,
    adminEmail: requireEnv('SEED_ADMIN_EMAIL'),
    adminPassword: requirePassword('SEED_ADMIN_PASSWORD'),
    demoPassword: mode === 'demo' ? requirePassword('SEED_DEMO_PASSWORD') : '',
  };
}
