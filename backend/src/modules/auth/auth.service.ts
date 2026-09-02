import { Injectable, ConflictException, Logger, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { ConfigService } from '@nestjs/config';

import { AppConfiguration } from '../../config/configuration';
import { DUMMY_HASH } from './auth.constants';
import { PERMISSIONS } from './auth.permissions';
import { LoginDto } from './dto/login.dto';
import { TokenService } from './token.service';
import { LoginResult } from './dto/login-response.model';
import { RefreshTokenService } from './refresh/refresh-token.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { AnalyticsEventType } from '../analytics/analytics-event-type.enum';

const SALT_ROUNDS = 10;
const PRISMA_UNIQUE_CONSTRAINT_ERROR = 'P2002';

export interface RegisteredUser {
  id: string;
  email: string;
  name: string;
  handle: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
}
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly configService: ConfigService<AppConfiguration, true>,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async register(dto: RegisterDto): Promise<RegisteredUser> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const normalizedHandle = dto.handle.trim();
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { handle: normalizedHandle }],
      },
      select: {
        email: true,
        handle: true,
      },
    });
    if (existing?.email === normalizedEmail) {
      throw new ConflictException('EMAIL_ALREADY_EXISTS');
    }
    if (existing?.handle === normalizedHandle) {
      throw new ConflictException('USERNAME_TAKEN');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          name: dto.name.trim(),
          handle: normalizedHandle,
          passwordHash,
        },
        select: {
          id: true,
          email: true,
          name: true,
          handle: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });

      await this.analyticsService.record(AnalyticsEventType.USER_REGISTERED, user.id);

      return user;
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_UNIQUE_CONSTRAINT_ERROR
      ) {
        throw new ConflictException('EMAIL_OR_HANDLE_ALREADY_EXISTS');
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<LoginResult> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
      select: {
        id: true,
        passwordHash: true,
        twoFactorEnabled: true,
        role: true,
        status: true,
        deletedAt: true,
      },
    });

    const compareHash = user?.passwordHash ?? DUMMY_HASH;

    const passwordMatches = await bcrypt.compare(dto.password, compareHash);

    const validCredentials =
      user !== null &&
      passwordMatches &&
      user.status === UserStatus.ACTIVE &&
      user.deletedAt === null;

    if (!validCredentials) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const jwtConfig = this.configService.get('jwt', { infer: true });

    if (user.twoFactorEnabled) {
      const mfaPendingToken = await this.tokenService.issueMfaPendingToken(user.id);

      return {
        requiresMfa: true,
        mfaPendingToken,
        expiresIn: jwtConfig.mfaPendingTokenTtl,
      };
    }

    const permissions = [...PERMISSIONS[user.role]];

    const accessToken = await this.tokenService.issueAccessToken(user.id, permissions);

    const { refreshToken, refreshExpiresInMs } = await this.refreshTokenService.createSession(
      user.id,
    );

    try {
      await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          lastLoginAt: new Date(),
        },
      });
    } catch {
      this.logger.warn(`Unable to update lastLoginAt for user ${user.id}`);
    }

    await this.analyticsService.record(AnalyticsEventType.USER_LOGGED_IN, user.id);

    return {
      requiresMfa: false,
      accessToken,
      refreshToken,
      refreshExpiresInMs,
      expiresIn: jwtConfig.accessTokenTtl,
    };
  }
}
