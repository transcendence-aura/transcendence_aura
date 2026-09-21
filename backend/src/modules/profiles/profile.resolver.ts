import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ProfileService } from './profile.service';
import { PublicProfileType } from './profile.model';
import { UpdateProfileInput } from './profile.input';
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

  @Mutation(() => UserType)
  @UseGuards(RolesGuard)
  updateMyProfile(
    @CurrentUser() userId: string,
    @Args('input') input: UpdateProfileInput,
  ): Promise<UserType> {
    return this.profileService.updateProfile(userId, input);
  }
}
