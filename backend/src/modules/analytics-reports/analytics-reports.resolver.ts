import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AnalyticsReportsService } from './analytics-reports.service';
import { AnalyticsPeriod } from './analytics-period.enum';
import { TopProductsByWishlistAddsArgs } from './analytics-reports.args';
import { AnalyticsTimeSeriesPointType, TopWishlistedProductType } from './analytics-reports.model';

@Resolver()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AnalyticsReportsResolver {
  constructor(private readonly analyticsReportsService: AnalyticsReportsService) {}

  @Query(() => [AnalyticsTimeSeriesPointType])
  registrationsOverTime(
    @Args('period', { type: () => AnalyticsPeriod }) period: AnalyticsPeriod,
  ): Promise<AnalyticsTimeSeriesPointType[]> {
    return this.analyticsReportsService.registrationsOverTime(period);
  }

  @Query(() => [AnalyticsTimeSeriesPointType])
  messagesOverTime(
    @Args('period', { type: () => AnalyticsPeriod }) period: AnalyticsPeriod,
  ): Promise<AnalyticsTimeSeriesPointType[]> {
    return this.analyticsReportsService.messagesOverTime(period);
  }

  @Query(() => [AnalyticsTimeSeriesPointType])
  followsOverTime(
    @Args('period', { type: () => AnalyticsPeriod }) period: AnalyticsPeriod,
  ): Promise<AnalyticsTimeSeriesPointType[]> {
    return this.analyticsReportsService.followsOverTime(period);
  }

  @Query(() => [AnalyticsTimeSeriesPointType])
  activeUsersOverTime(
    @Args('period', { type: () => AnalyticsPeriod }) period: AnalyticsPeriod,
  ): Promise<AnalyticsTimeSeriesPointType[]> {
    return this.analyticsReportsService.activeUsersOverTime(period);
  }

  @Query(() => [TopWishlistedProductType])
  topProductsByWishlistAdds(
    @Args() args: TopProductsByWishlistAddsArgs,
  ): Promise<TopWishlistedProductType[]> {
    return this.analyticsReportsService.topProductsByWishlistAdds(args.period, args.limit);
  }
}
