import { ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ProductType, ProductVariantType } from '../products/product.model';
import { AdminProductService } from './admin-product.service';
import {
  AdminCreateProductInput,
  AdminCreateProductVariantInput,
  AdminUpdateProductInput,
  AdminUpdateProductVariantInput,
} from './admin-product.input';

@Resolver(() => ProductType)
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminProductResolver {
  constructor(private readonly adminProductService: AdminProductService) {}

  @Mutation(() => ProductType)
  adminCreateProduct(@Args('input') input: AdminCreateProductInput): Promise<ProductType> {
    return this.adminProductService.createProduct(input);
  }

  @Mutation(() => ProductType)
  adminUpdateProduct(
    @Args('id', ParseUUIDPipe) id: string,
    @Args('input') input: AdminUpdateProductInput,
  ): Promise<ProductType> {
    return this.adminProductService.updateProduct(id, input);
  }

  @Mutation(() => ProductType)
  adminDeleteProduct(@Args('id', ParseUUIDPipe) id: string): Promise<ProductType> {
    return this.adminProductService.deleteProduct(id);
  }

  @Mutation(() => ProductVariantType)
  adminAddProductVariant(
    @Args('productId', ParseUUIDPipe) productId: string,
    @Args('input') input: AdminCreateProductVariantInput,
  ): Promise<ProductVariantType> {
    return this.adminProductService.addVariant(productId, input);
  }

  @Mutation(() => ProductVariantType)
  adminUpdateProductVariant(
    @Args('variantId', ParseUUIDPipe) variantId: string,
    @Args('input') input: AdminUpdateProductVariantInput,
  ): Promise<ProductVariantType> {
    return this.adminProductService.updateVariant(variantId, input);
  }

  @Mutation(() => Boolean)
  adminDeleteProductVariant(
    @Args('variantId', ParseUUIDPipe) variantId: string,
  ): Promise<boolean> {
    return this.adminProductService.deleteVariant(variantId);
  }
}
