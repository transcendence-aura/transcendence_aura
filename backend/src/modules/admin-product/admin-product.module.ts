import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ProductsModule } from '../products/product.module';
import { AdminProductResolver } from './admin-product.resolver';
import { AdminProductService } from './admin-product.service';

@Module({
  imports: [PrismaModule, AuthModule, ProductsModule],
  providers: [AdminProductResolver, AdminProductService],
})
export class AdminProductModule {}
