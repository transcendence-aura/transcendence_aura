import { Query, Resolver } from '@nestjs/graphql';
import { HealthStatus } from './health.model';

@Resolver(() => HealthStatus)
export class HealthResolver {
  // Static status for now; real dependency checks TBD.
  @Query(() => HealthStatus)
  health(): HealthStatus {
    return { status: 'ok' };
  }
}
