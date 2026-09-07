import { Args, Query, Resolver } from '@nestjs/graphql';
import { ProfileService } from './profile.service';
import { PublicProfileType } from './profile.model';

@Resolver()
export class ProfileResolver {
  constructor(private readonly profileService: ProfileService) {}

  @Query(() => PublicProfileType)
  userProfile(@Args('handle') handle: string): Promise<PublicProfileType> {
    return this.profileService.getProfile(handle);
  }
}
