import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { WishlistService } from './wishlist.service';
import { WishlistItemType } from './wishlist.model';
import { WishlistItemInput } from './wishlist.input';

@Resolver()
@UseGuards(RolesGuard)
export class WishlistResolver {
  constructor(private readonly wishlistService: WishlistService) {}

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
