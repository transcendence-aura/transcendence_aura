import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ProfileService } from './profile.service';
import { ProfileDirectoryPageType, PublicProfileType } from './profile.model';
import { ProfileDirectoryInput, UpdateProfileInput } from './profile.input';
import { UserType } from '../auth/auth.model';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { TokenService } from '../auth/token.service';
import { AuthenticatedRequest } from '../../common/types/authenticated-request';

@Resolver()
export class ProfileResolver {
  constructor(
    private readonly profileService: ProfileService,
    private readonly tokenService: TokenService,
  ) {}

  // Public: the token is read only to tell whether the viewer follows this profile.
  @Query(() => PublicProfileType)
  async userProfile(
    @Args('handle') handle: string,
    @Context() context: { req: AuthenticatedRequest },
  ): Promise<PublicProfileType> {
    const viewerId = await this.tokenService.getOptionalUserId(context.req.headers.authorization);
    return this.profileService.getProfile(handle, viewerId);
  }

  // Public: the token is read only to exclude the viewer from their own directory.
  @Query(() => ProfileDirectoryPageType)
  async profileDirectory(
    @Context() context: { req: AuthenticatedRequest },
    // `input?: ProfileDirectoryInput` (not `| undefined`) is required here: TS only emits the
    // real class in design:paramtypes for an optional param written with `?`. A `| undefined`
    // union reflects as `Object`, which is exactly the metatype Nest's ValidationPipe treats as
    // "nothing to validate" - it silently skips class-validator/class-transformer entirely and
    // passes the raw, unchecked input straight through.
    @Args('input', { type: () => ProfileDirectoryInput, nullable: true })
    input?: ProfileDirectoryInput,
  ): Promise<ProfileDirectoryPageType> {
    const viewerId = await this.tokenService.getOptionalUserId(context.req.headers.authorization);
    return this.profileService.listProfiles(input ?? { page: 1, limit: 20 }, viewerId);
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
