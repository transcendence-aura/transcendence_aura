import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { HealthResolver } from './health.resolver';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [HealthResolver],
})
export class HealthModule {}
