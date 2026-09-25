import { Module } from '@nestjs/common';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../../database/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from './token.service';
import { GqlAuthGuard } from './gql-auth.guard';
import { RefreshTokenService } from './refresh/refresh-token.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { VaultModule } from '../../infrastructure/vault/vault.module';
import { TotpService } from './totp.service';
import { TwoFactorService } from './two-factor.service';
import { AuthThrottlerStorage } from './auth-throttler.storage';

@Module({
  imports: [PrismaModule, JwtModule.register({}), AnalyticsModule, VaultModule],
  controllers: [AuthController],
  providers: [
    AuthResolver,
    AuthService,
    TokenService,
    GqlAuthGuard,
    RefreshTokenService,
    TotpService,
    TwoFactorService,
    AuthThrottlerStorage,
  ],
  exports: [AuthService, TokenService, GqlAuthGuard, RefreshTokenService],
})
export class AuthModule {}
