import { Module } from '@nestjs/common';
import { CategoriesModule } from '../modules/categories/category.module';
import { CollectionsModule } from '../modules/collections/collection.module';
import { ProductsModule } from '../modules/products/product.module';
import { ProfileModule } from '../modules/profiles/profile.module';
import { WishlistModule } from '../modules/wishlist/wishlist.module';
import { ApiController } from './api.controller';

@Module({
  imports: [ProductsModule, CollectionsModule, CategoriesModule, ProfileModule, WishlistModule],
  controllers: [ApiController],
})
export class ApiModule {}
