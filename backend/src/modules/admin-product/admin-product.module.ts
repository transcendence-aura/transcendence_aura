import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ProductsModule } from '../products/product.module';
import { AdminProductResolver } from './admin-product.resolver';
import { AdminProductService } from './admin-product.service';
import { AdminProductImageController } from './admin-product-image.controller';
import { AdminProductImageService } from './admin-product-image.service';

@Module({
  imports: [PrismaModule, AuthModule, ProductsModule],
  controllers: [AdminProductImageController],
  providers: [AdminProductResolver, AdminProductService, AdminProductImageService],
})
export class AdminProductModule {}
