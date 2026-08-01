import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { ProductResolver } from './products.resolver';
import { ProductsService } from './product.service';

@Module({
  imports: [PrismaModule],
  providers: [ProductResolver, ProductsService],
})
export class ProductsModule {}
