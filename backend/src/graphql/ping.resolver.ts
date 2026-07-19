import { Query, Resolver } from '@nestjs/graphql';

// Minimal resolver ; To be replaced in AUR-36
@Resolver()
export class PingResolver {
  @Query(() => String)
  ping(): string {
    return 'test';
  }
}
