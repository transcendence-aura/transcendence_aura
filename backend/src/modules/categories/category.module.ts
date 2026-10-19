import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { CategoriesService } from './category.service';

@Module({
  imports: [PrismaModule],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
