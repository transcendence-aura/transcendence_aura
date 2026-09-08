import { UseGuards } from '@nestjs/common';
import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AnalyticsReportsService } from './analytics-reports.service';
import { AnalyticsPeriod } from './analytics-period.enum';
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
    @Args('period', { type: () => AnalyticsPeriod }) period: AnalyticsPeriod,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<TopWishlistedProductType[]> {
    return this.analyticsReportsService.topProductsByWishlistAdds(period, limit);
  }
}
