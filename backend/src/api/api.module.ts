import { Module } from '@nestjs/common';
import { CategoriesModule } from '../modules/categories/category.module';
import { CollectionsModule } from '../modules/collections/collection.module';
import { ProductsModule } from '../modules/products/product.module';
import { ApiController } from './api.controller';

@Module({
  imports: [ProductsModule, CollectionsModule, CategoriesModule],
  controllers: [ApiController],
})
export class ApiModule {}
