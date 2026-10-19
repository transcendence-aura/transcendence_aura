import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { AnalyticsPeriod } from './analytics-period.enum';

@ArgsType()
export class TopProductsByWishlistAddsArgs {
  @Field(() => AnalyticsPeriod)
  @IsEnum(AnalyticsPeriod)
  period!: AnalyticsPeriod;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
