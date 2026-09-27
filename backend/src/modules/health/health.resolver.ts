import { UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PrismaService } from '../../database/prisma.service';
import { HealthStatus, ServiceHealth } from './health.model';

const CHECK_TIMEOUT_MS = 3000;

// Internal service state: admins only.
@Resolver(() => HealthStatus)
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class HealthResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => HealthStatus)
  async health(): Promise<HealthStatus> {
    const [database, vault] = await Promise.all([
      this.measure('database', () => this.checkDatabase()),
      this.measure('vault', () => this.checkVault()),
    ]);
    const services: ServiceHealth[] = [
      { name: 'backend', up: true, latencyMs: 0 },
      database,
      vault,
    ];

    return {
      status: services.every((service) => service.up) ? 'ok' : 'degraded',
      services,
      checkedAt: new Date(),
    };
  }

  private async measure(name: string, check: () => Promise<boolean>): Promise<ServiceHealth> {
    const start = Date.now();
    const up = await check();
    return { name, up, latencyMs: Date.now() - start };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async checkVault(): Promise<boolean> {
    const vaultAddr = process.env.VAULT_ADDR;
    if (!vaultAddr) return false;

    try {
      const response = await fetch(`${vaultAddr}/v1/sys/health`, {
        signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
