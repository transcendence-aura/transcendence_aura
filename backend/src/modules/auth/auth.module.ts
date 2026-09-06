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

@Module({
  imports: [PrismaModule, JwtModule.register({}), AnalyticsModule],
  controllers: [AuthController],
  providers: [AuthResolver, AuthService, TokenService, GqlAuthGuard, RefreshTokenService],
  exports: [AuthService, TokenService, GqlAuthGuard, RefreshTokenService],
})
export class AuthModule {}
