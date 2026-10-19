import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AdminProductFamilyResolver } from './admin-product-family.resolver';
import { AdminProductFamilyService } from './admin-product-family.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [AdminProductFamilyResolver, AdminProductFamilyService],
})
export class AdminProductFamilyModule {}
