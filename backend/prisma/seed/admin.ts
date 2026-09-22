import * as bcrypt from 'bcrypt';
import { UserRole, UserStatus } from '@prisma/client';
import { prisma } from './client';
import type { SeedConfig } from './config';

const SALT_ROUNDS = 10;

export async function seedAdmin(config: SeedConfig): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email: config.adminEmail } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: UserRole.ADMIN, status: UserStatus.ACTIVE, deletedAt: null },
    });
    process.stdout.write(`Admin ${config.adminEmail} already exists, password left untouched\n`);
    return;
  }

  await prisma.user.create({
    data: {
      name: 'Aura Administrator',
      email: config.adminEmail,
      handle: 'admin',
      passwordHash: await bcrypt.hash(config.adminPassword, SALT_ROUNDS),
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
  });
  process.stdout.write(`Admin ${config.adminEmail} created\n`);
}

export async function assertAdminExists(): Promise<void> {
  const admins = await prisma.user.count({
    where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE, deletedAt: null },
  });

  if (admins === 0) {
    throw new Error('No active admin in the database after seeding');
  }
}
