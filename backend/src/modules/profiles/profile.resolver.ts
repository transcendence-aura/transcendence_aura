import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ProfileService } from './profile.service';
import { PublicProfileType } from './profile.model';
import { UpdateProfileInput } from './profile.input';
import { UserType } from '../auth/auth.model';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Resolver()
export class ProfileResolver {
  constructor(private readonly profileService: ProfileService) {}

  @Query(() => PublicProfileType)
  userProfile(@Args('handle') handle: string): Promise<PublicProfileType> {
    return this.profileService.getProfile(handle);
  }

  @Mutation(() => UserType)
  @UseGuards(RolesGuard)
  updateMyProfile(
    @CurrentUser() userId: string,
    @Args('input') input: UpdateProfileInput,
  ): Promise<UserType> {
    return this.profileService.updateProfile(userId, input);
  }
}
