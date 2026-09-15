import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { UserType } from './auth.model';
import { LoginInput } from './dto/login.input';
import { LoginResponse, RefreshResponse } from './dto/login-response.model';
import { RefreshTokenService } from './refresh/refresh-token.service';
import { REFRESH_COOKIE_NAME, getRefreshCookieOptions } from './refresh/refresh-token.constants';
import { UnauthorizedException } from '@nestjs/common';
import { ACCESS_COOKIE_NAME, getAccessCookieOptions } from './auth.constants';
import { AppConfiguration } from '../../config/configuration';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { TwoFactorService } from './two-factor.service';
import { ConfirmTwoFactorInput } from './dto/confirm-two-factor.input';
import { TwoFactorSetupResponse, TwoFactorConfirmResponse } from './dto/two-factor-response.model';
import { VerifyMfaInput } from './dto/verify-mfa.input';
import { VerifyMfaResponse } from './dto/verify-mfa-response.model';

@Resolver(() => UserType)
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly configService: ConfigService<AppConfiguration, true>,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  @Mutation(() => UserType)
  register(@Args('input') dto: RegisterDto): Promise<UserType> {
    return this.authService.register(dto);
  }

  @Mutation(() => LoginResponse)
  async login(
    @Args('input') input: LoginInput,
    @Context()
    context: {
      req: Request;
      res: Response;
    },
  ): Promise<LoginResponse> {
    const result = await this.authService.login(input);

    if (result.requiresMfa) {
      return result;
    }

    const jwtConfig = this.configService.getOrThrow<AppConfiguration['jwt']>('jwt');

    const accessTokenTtl = jwtConfig.accessTokenTtl;

    context.res.cookie(
      ACCESS_COOKIE_NAME,
      result.accessToken,
      getAccessCookieOptions(accessTokenTtl * 1000),
    );

    context.res.cookie(
      REFRESH_COOKIE_NAME,
      result.refreshToken,
      getRefreshCookieOptions(result.refreshExpiresInMs),
    );

    return {
      requiresMfa: false,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }

  @Mutation(() => RefreshResponse)
  async refresh(
    @Context()
    context: {
      req: Request;
      res: Response;
    },
  ): Promise<RefreshResponse> {
    const presentedToken = context.req.cookies?.[REFRESH_COOKIE_NAME];

    if (typeof presentedToken !== 'string' || presentedToken.length === 0) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const result = await this.refreshTokenService.refresh(presentedToken);

    const jwtConfig = this.configService.getOrThrow<AppConfiguration['jwt']>('jwt');
    const accessTokenTtl = jwtConfig.accessTokenTtl;
    context.res.cookie(
      ACCESS_COOKIE_NAME,
      result.accessToken,
      getAccessCookieOptions(accessTokenTtl * 1000),
    );

    context.res.cookie(
      REFRESH_COOKIE_NAME,
      result.refreshToken,
      getRefreshCookieOptions(result.refreshExpiresInMs),
    );
    return {
      accessToken: result.accessToken,
    };
  }

  @UseGuards(RolesGuard)
  @Mutation(() => TwoFactorSetupResponse)
  async setupTwoFactor(
    @Context()
    context: {
      req: AuthenticatedRequest;
      res: Response;
    },
  ): Promise<TwoFactorSetupResponse> {
    context.res.setHeader('Cache-Control', 'no-store');
    return this.twoFactorService.beginEnrollment(context.req.userId!);
  }

  @UseGuards(RolesGuard)
  @Mutation(() => TwoFactorConfirmResponse)
  async confirmTwoFactor(
    @Args('input')
    input: ConfirmTwoFactorInput,
    @Context()
    context: {
      req: AuthenticatedRequest;
    },
  ): Promise<TwoFactorConfirmResponse> {
    return this.twoFactorService.confirmEnrollment(context.req.userId!, input.code);
  }

  @Mutation(() => VerifyMfaResponse)
  async verifyMfa(
    @Args('input')
    input: VerifyMfaInput,
    @Context()
    context: {
      res: Response;
    },
  ): Promise<VerifyMfaResponse> {
    const result = await this.authService.verifyMfa(input.mfaPendingToken, input.code);

    const jwtConfig = this.configService.getOrThrow<AppConfiguration['jwt']>('jwt');

    const accessTokenTtl = jwtConfig.accessTokenTtl;

    context.res.setHeader('Cache-Control', 'no-store');

    context.res.cookie(
      ACCESS_COOKIE_NAME,
      result.accessToken,
      getAccessCookieOptions(accessTokenTtl * 1000),
    );

    context.res.cookie(
      REFRESH_COOKIE_NAME,
      result.refreshToken,
      getRefreshCookieOptions(result.refreshExpiresInMs),
    );

    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }
}
