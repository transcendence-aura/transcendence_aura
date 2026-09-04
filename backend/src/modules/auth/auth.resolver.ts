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

@Resolver(() => UserType)
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly configService: ConfigService<AppConfiguration, true>,
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
}
