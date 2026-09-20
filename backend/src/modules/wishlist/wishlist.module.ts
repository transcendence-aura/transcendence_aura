import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProductsModule } from '../products/product.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { CircleFeedModule } from '../circle-feed/circle-feed.module';
import { WishlistResolver } from './wishlist.resolver';
import { WishlistService } from './wishlist.service';

@Module({
  imports: [AuthModule, ProductsModule, AnalyticsModule, CircleFeedModule],
  providers: [WishlistResolver, WishlistService],
  exports: [WishlistService],
})
export class WishlistModule {}
