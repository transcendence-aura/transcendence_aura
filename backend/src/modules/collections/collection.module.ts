import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { CollectionsResolver } from './collection.resolver';
import { CollectionsService } from './collection.service';

@Module({
  imports: [PrismaModule],
  providers: [CollectionsResolver, CollectionsService],
  exports: [CollectionsService],
})
export class CollectionsModule {}
