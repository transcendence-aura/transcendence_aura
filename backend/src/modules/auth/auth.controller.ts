import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginResult } from './dto/login-response.model';
import type { Request, Response } from 'express';
import { RefreshTokenService } from './refresh/refresh-token.service';
import { ConfigService } from '@nestjs/config';
import { AppConfiguration } from '../../config/configuration';
import {
  REFRESH_COOKIE_NAME,
  getRefreshCookieOptions,
  getRefreshCookieClearOptions,
} from './refresh/refresh-token.constants';
import {
  ACCESS_COOKIE_NAME,
  getAccessCookieOptions,
  getAccessCookieClearOptions,
} from './auth.constants';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly configService: ConfigService<AppConfiguration, true>,
  ) {}

  private setAccessCookie(res: Response, accessToken: string): void {
    const { accessTokenTtl } = this.configService.getOrThrow<AppConfiguration['jwt']>('jwt');
    res.cookie(ACCESS_COOKIE_NAME, accessToken, getAccessCookieOptions(accessTokenTtl * 1000));
  }

  private setRefreshCookie(res: Response, refreshToken: string, refreshExpiresInMs: number): void {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions(refreshExpiresInMs));
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie(ACCESS_COOKIE_NAME, getAccessCookieClearOptions());
    res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieClearOptions());
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result: LoginResult = await this.authService.login(dto);

    if (result.requiresMfa) {
      return result;
    }
    this.setAccessCookie(res, result.accessToken);
    this.setRefreshCookie(res, result.refreshToken, result.refreshExpiresInMs);

    return {
      requiresMfa: result.requiresMfa,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const presentedToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (typeof presentedToken !== 'string' || presentedToken.length === 0) {
      this.clearAuthCookies(res);
      throw new UnauthorizedException('Invalid refresh token.');
    }

    try {
      const result = await this.refreshTokenService.refresh(presentedToken);
      this.setAccessCookie(res, result.accessToken);
      this.setRefreshCookie(res, result.refreshToken, result.refreshExpiresInMs);
      return { accessToken: result.accessToken };
    } catch (error) {
      this.clearAuthCookies(res);
      throw error;
    }
  }
}
