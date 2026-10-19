import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AdminCollectionResolver } from './admin-collection.resolver';
import { AdminCollectionService } from './admin-collection.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [AdminCollectionResolver, AdminCollectionService],
})
export class AdminCollectionModule {}
