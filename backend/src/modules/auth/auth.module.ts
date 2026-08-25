import { Module } from '@nestjs/common';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../../database/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from './token.service';
import { GqlAuthGuard } from './gql-auth.guard';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthResolver, AuthService, TokenService, GqlAuthGuard],
  exports: [AuthService, TokenService, GqlAuthGuard],
})
export class AuthModule {}
