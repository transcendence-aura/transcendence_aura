import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { CategoriesModule } from '../modules/categories/category.module';
import { CollectionsModule } from '../modules/collections/collection.module';
import { ProductsModule } from '../modules/products/product.module';
import { ProfileModule } from '../modules/profiles/profile.module';
import { WishlistModule } from '../modules/wishlist/wishlist.module';
import { ApiController } from './api.controller';
import { API_RATE_LIMIT } from './api-rate-limit';

@Module({
  imports: [
    ProductsModule,
    CollectionsModule,
    CategoriesModule,
    ProfileModule,
    WishlistModule,
    ThrottlerModule.forRoot([{ limit: API_RATE_LIMIT.limit, ttl: API_RATE_LIMIT.ttlMs }]),
  ],
  controllers: [ApiController],
})
export class ApiModule {}
