import { prisma } from './client';
import { assertAdminExists, seedAdmin } from './admin';
import { readSeedConfig } from './config';
import { seedDemo } from './demo';
import { seedReference } from './reference';

async function main(): Promise<void> {
  const config = readSeedConfig();

  await seedReference();
  await seedAdmin(config);

  if (config.mode === 'demo') {
    await seedDemo(config);
  }

  await assertAdminExists();
}

async function run(): Promise<void> {
  try {
    await main();
  } catch (error: unknown) {
    const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
    process.stderr.write(`Database seed failed: ${message}\n`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void run();
