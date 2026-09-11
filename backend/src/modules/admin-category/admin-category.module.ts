import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AdminCategoryResolver } from './admin-category.resolver';
import { AdminCategoryService } from './admin-category.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [AdminCategoryResolver, AdminCategoryService],
})
export class AdminCategoryModule {}
