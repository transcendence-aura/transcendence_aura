import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ProfileService } from './profile.service';
import { ProfileDirectoryPageType, PublicProfileType } from './profile.model';
import { ProfileDirectoryInput, UpdateProfileInput } from './profile.input';
import { UserType } from '../auth/auth.model';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Resolver()
@UseGuards(RolesGuard)
export class ProfileResolver {
  constructor(private readonly profileService: ProfileService) {}

  @Query(() => PublicProfileType)
  userProfile(
    @Args('handle') handle: string,
    @CurrentUser() viewerId: string,
  ): Promise<PublicProfileType> {
    return this.profileService.getProfile(handle, viewerId);
  }

  @Query(() => ProfileDirectoryPageType)
  profileDirectory(
    @CurrentUser() viewerId: string,
    // `input?: ProfileDirectoryInput` (not `| undefined`) is required here: TS only emits the
    // real class in design:paramtypes for an optional param written with `?`. A `| undefined`
    // union reflects as `Object`, which is exactly the metatype Nest's ValidationPipe treats as
    // "nothing to validate" - it silently skips class-validator/class-transformer entirely and
    // passes the raw, unchecked input straight through.
    @Args('input', { type: () => ProfileDirectoryInput, nullable: true })
    input?: ProfileDirectoryInput,
  ): Promise<ProfileDirectoryPageType> {
    return this.profileService.listProfiles(input ?? { page: 1, limit: 20 }, viewerId);
  }

  @Mutation(() => UserType)
  updateMyProfile(
    @CurrentUser() userId: string,
    @Args('input') input: UpdateProfileInput,
  ): Promise<UserType> {
    return this.profileService.updateProfile(userId, input);
  }
}
