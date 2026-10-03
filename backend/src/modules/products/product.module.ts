import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ProductResolver } from './products.resolver';
import { ProductsService } from './product.service';

@Module({
  imports: [PrismaModule, AuthModule, AnalyticsModule],
  providers: [ProductResolver, ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
