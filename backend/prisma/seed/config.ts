import { readFile } from 'node:fs/promises';

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

async function requireSecretFile(envVar: string): Promise<string> {
  const filePath = requireEnv(envVar);
  let value: string;

  try {
    value = (await readFile(filePath, 'utf8')).trim();
  } catch {
    throw new Error(`Unable to read ${envVar} at ${filePath}`);
  }

  if (!value) {
    throw new Error(`${envVar} points to an empty file`);
  }

  return value;
}

async function requirePasswordFile(envVar: string): Promise<string> {
  const value = await requireSecretFile(envVar);

  if (value.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `${envVar} must point to a file with at least ${MIN_PASSWORD_LENGTH} characters`,
    );
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

export async function readSeedConfig(): Promise<SeedConfig> {
  const mode = readMode();

  const [adminEmail, adminPassword] = await Promise.all([
    requireSecretFile('SEED_ADMIN_EMAIL_FILE'),
    requirePasswordFile('SEED_ADMIN_PASSWORD_FILE'),
  ]);

  return {
    mode,
    adminEmail,
    adminPassword,
    demoPassword: mode === 'demo' ? requirePassword('SEED_DEMO_PASSWORD') : '',
  };
}
