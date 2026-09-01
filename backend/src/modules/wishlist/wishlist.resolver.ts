import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ProductType } from '../products/product.model';
import { WishlistService } from './wishlist.service';
import { WishlistItemType } from './wishlist.model';
import { WishlistItemInput } from './wishlist.input';

@Resolver()
@UseGuards(RolesGuard)
export class WishlistResolver {
  constructor(private readonly wishlistService: WishlistService) {}

  @Query(() => [ProductType])
  wishlist(@CurrentUser() userId: string): Promise<ProductType[]> {
    return this.wishlistService.getWishlist(userId);
  }

  @Mutation(() => WishlistItemType)
  addWishlistItem(
    @CurrentUser() userId: string,
    @Args('input') input: WishlistItemInput,
  ): Promise<WishlistItemType> {
    return this.wishlistService.addItem(userId, input.productId);
  }

  @Mutation(() => Boolean)
  removeWishlistItem(
    @CurrentUser() userId: string,
    @Args('input') input: WishlistItemInput,
  ): Promise<boolean> {
    return this.wishlistService.removeItem(userId, input.productId);
  }
}
