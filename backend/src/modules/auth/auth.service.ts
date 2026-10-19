import {
  BadRequestException,
  Injectable,
  ConflictException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordInput } from './dto/change-password.input';
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
import { VaultService } from '../../infrastructure/vault/vault.service';
import { TotpService } from './totp.service';
import { slugify } from '../../common/utils/slugify';

const SALT_ROUNDS = 10;
const PRISMA_UNIQUE_CONSTRAINT_ERROR = 'P2002';
const HANDLE_MAX_LENGTH = 30;
const RANDOM_SUFFIX_BYTES = 2; // -> 4 hex chars
const HANDLE_BASE_MAX_LENGTH = HANDLE_MAX_LENGTH - RANDOM_SUFFIX_BYTES * 2 - 1;

export interface RegisteredUser {
  id: string;
  email: string;
  name: string;
  handle: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  handle: string;
  bio?: string;
}

type AuthenticatedSession = {
  accessToken: string;
  refreshToken: string;
  refreshExpiresInMs: number;
  expiresIn: number;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly configService: ConfigService<AppConfiguration, true>,
    private readonly analyticsService: AnalyticsService,
    private readonly vaultService: VaultService,
    private readonly totpService: TotpService,
  ) {}

  async findById(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        handle: true,
        bio: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE || user.deletedAt !== null) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      handle: user.handle,
      bio: user.bio ?? undefined,
    };
  }

  async register(dto: RegisterDto): Promise<RegisteredUser> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const name = dto.name.trim();

    const emailTaken = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (emailTaken) {
      throw new ConflictException('EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const handle = await this.generateUniqueHandle(name);

      try {
        const user = await this.prisma.user.create({
          data: {
            email: normalizedEmail,
            name,
            handle,
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
          !(error instanceof Prisma.PrismaClientKnownRequestError) ||
          error.code !== PRISMA_UNIQUE_CONSTRAINT_ERROR
        ) {
          throw error;
        }

        const conflictedOnEmail = String(error.meta?.target ?? '').includes('email');
        if (conflictedOnEmail) {
          throw new ConflictException('EMAIL_ALREADY_EXISTS');
        }
        if (attempt === maxAttempts) {
          throw new ConflictException('HANDLE_GENERATION_FAILED');
        }
      }
    }

    throw new ConflictException('HANDLE_GENERATION_FAILED');
  }

  private async generateUniqueHandle(name: string): Promise<string> {
    const base = slugify(name).slice(0, HANDLE_BASE_MAX_LENGTH) || 'user';

    if (!(await this.handleTaken(base))) {
      return base;
    }

    const maxAttempts = 20;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const candidate = `${base}-${randomBytes(RANDOM_SUFFIX_BYTES).toString('hex')}`;
      if (!(await this.handleTaken(candidate))) {
        return candidate;
      }
    }

    throw new ConflictException('HANDLE_GENERATION_FAILED');
  }

  private async handleTaken(handle: string): Promise<boolean> {
    const existing = await this.prisma.user.findUnique({
      where: { handle },
      select: { id: true },
    });
    return existing !== null;
  }

  private async issueAuthenticatedSession(user: {
    id: string;
    role: UserRole;
  }): Promise<AuthenticatedSession> {
    const jwtConfig = this.configService.get('jwt', { infer: true });

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
      accessToken,
      refreshToken,
      refreshExpiresInMs,
      expiresIn: jwtConfig.accessTokenTtl,
    };
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

    const session = await this.issueAuthenticatedSession(user);

    return {
      requiresMfa: false,
      ...session,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordInput): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const currentPasswordMatches = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!currentPasswordMatches) {
      throw new BadRequestException('INVALID_CURRENT_PASSWORD');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // A leaked or stolen session should not survive a password change: every
    // refresh token, including the one behind the request that just changed
    // it, is revoked so all devices (this one too) must sign in again.
    await this.refreshTokenService.revokeAllForUser(userId, 'PASSWORD_CHANGED');

    await this.analyticsService.record(AnalyticsEventType.PASSWORD_CHANGED, userId);
  }

  async verifyMfa(mfaPendingToken: string, code: string): Promise<AuthenticatedSession> {
    try {
      const payload = await this.tokenService.verifyMfaPendingToken(mfaPendingToken);

      const user = await this.prisma.user.findUnique({
        where: {
          id: payload.sub,
        },
        select: {
          id: true,
          twoFactorEnabled: true,
          role: true,
          status: true,
          deletedAt: true,
        },
      });

      if (
        !user ||
        !user.twoFactorEnabled ||
        user.status !== UserStatus.ACTIVE ||
        user.deletedAt !== null
      ) {
        this.logger.warn('MFA verification failed: Invalid user state');
        throw new UnauthorizedException();
      }

      const secret = await this.vaultService.readTotpSecret(user.id);

      if (!secret) {
        this.logger.warn('MFA verification failed: Secret unavailable');
        throw new UnauthorizedException();
      }

      const valid = await this.totpService.verifyCode(secret, code);

      if (!valid) {
        this.logger.warn('MFA verification failed: Invalid code');
        throw new UnauthorizedException();
      }

      const session = await this.issueAuthenticatedSession(user);

      return session;
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) {
        this.logger.warn(
          `MFA verification failed unexpectedly: ${error instanceof Error ? error.name : 'unknown error'}`,
        );
      }
      throw new UnauthorizedException('Invalid authentication challenge');
    }
  }
}
