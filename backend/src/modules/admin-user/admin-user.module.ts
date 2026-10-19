import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AdminUserResolver } from './admin-user.resolver';
import { AdminUserService } from './admin-user.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [AdminUserResolver, AdminUserService],
})
export class AdminUserModule {}
