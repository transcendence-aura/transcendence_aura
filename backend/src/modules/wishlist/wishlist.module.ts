import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProductsModule } from '../products/product.module';
import { WishlistResolver } from './wishlist.resolver';
import { WishlistService } from './wishlist.service';

@Module({
  imports: [AuthModule, ProductsModule],
  providers: [WishlistResolver, WishlistService],
})
export class WishlistModule {}
