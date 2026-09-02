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
import { REFRESH_COOKIE_NAME, getRefreshCookieOptions } from './refresh/refresh-token.constants';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

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
    res.cookie(
      REFRESH_COOKIE_NAME,
      result.refreshToken,
      getRefreshCookieOptions(result.refreshExpiresInMs),
    );

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
      throw new UnauthorizedException('Invalid refresh token.');
    }

    try {
      const result = await this.refreshTokenService.refresh(presentedToken);
      res.cookie(
        REFRESH_COOKIE_NAME,
        result.refreshToken,
        getRefreshCookieOptions(result.refreshExpiresInMs),
      );
      return { accessToken: result.accessToken };
    } catch (error) {
      res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions(0));
      throw error;
    }
  }
}
