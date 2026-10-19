import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { FollowService } from './follow.service';
import { FollowInput } from './follow.input';

@Resolver()
export class FollowResolver {
  constructor(private readonly followService: FollowService) {}

  @Mutation(() => Boolean)
  @UseGuards(RolesGuard)
  followUser(@CurrentUser() userId: string, @Args('input') input: FollowInput): Promise<boolean> {
    return this.followService.follow(userId, input.targetUserId);
  }

  @Mutation(() => Boolean)
  @UseGuards(RolesGuard)
  unfollowUser(@CurrentUser() userId: string, @Args('input') input: FollowInput): Promise<boolean> {
    return this.followService.unfollow(userId, input.targetUserId);
  }

  // Public: plain counts, no sensitive data.
  @Query(() => Int)
  followersCount(@Args('userId') userId: string): Promise<number> {
    return this.followService.followersCount(userId);
  }

  @Query(() => Int)
  followingCount(@Args('userId') userId: string): Promise<number> {
    return this.followService.followingCount(userId);
  }
}
