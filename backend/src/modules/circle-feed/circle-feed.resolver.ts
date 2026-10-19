import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CircleFeedService } from './circle-feed.service';
import { CircleFeedPageType } from './circle-feed.model';
import { CircleFeedPaginationInput } from './circle-feed.input';

@Resolver()
@UseGuards(RolesGuard)
export class CircleFeedResolver {
  constructor(private readonly circleFeedService: CircleFeedService) {}

  @Query(() => CircleFeedPageType)
  circleFeed(
    @CurrentUser() userId: string,
    @Args('pagination', { type: () => CircleFeedPaginationInput, nullable: true })
    pagination?: CircleFeedPaginationInput,
  ): Promise<CircleFeedPageType> {
    return this.circleFeedService.getFeed(userId, pagination ?? { page: 1, limit: 20 });
  }
}
