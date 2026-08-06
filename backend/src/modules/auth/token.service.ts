import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';

import { AppConfiguration } from '../../config/configuration';

export interface AccessTokenPayload {
  sub: string;
  tokenType: 'access';
  permissions: string[];
}

export interface MfaPendingTokenPayload {
  sub: string;
  tokenType: 'mfaPending';
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfiguration, true>,
  ) {}

  issueAccessToken(userId: string, permissions: string[]): Promise<string> {
    const jwt = this.configService.get('jwt', { infer: true });

    const payload: AccessTokenPayload = {
      sub: userId,
      tokenType: 'access',
      permissions,
    };

    return this.jwtService.signAsync(payload, {
      secret: jwt.accessSecret,
      algorithm: 'HS256',
      expiresIn: jwt.accessTokenTtl,
      issuer: jwt.issuer,
      audience: jwt.accessAudience,
      jwtid: randomUUID(),
    });
  }

  issueMfaPendingToken(userId: string): Promise<string> {
    const jwt = this.configService.get('jwt', { infer: true });

    const payload: MfaPendingTokenPayload = {
      sub: userId,
      tokenType: 'mfaPending',
    };

    return this.jwtService.signAsync(payload, {
      secret: jwt.accessSecret,
      algorithm: 'HS256',
      expiresIn: jwt.mfaPendingTokenTtl,
      issuer: jwt.issuer,
      audience: jwt.mfaPendingAudience,
      jwtid: randomUUID(),
    });
  }
}
