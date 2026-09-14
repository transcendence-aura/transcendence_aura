import { Injectable } from '@nestjs/common';
import { generateSecret, generateURI, verify } from 'otplib';

@Injectable()
export class TotpService {
  generateSecret(): string {
    return generateSecret();
  }

  generateProvisioningUri(params: { email: string; secret: string }): string {
    return generateURI({
      issuer: 'Aura',
      label: params.email,
      secret: params.secret,
    });
  }

  async verifyCode(secret: string, code: string): Promise<boolean> {
    const result = await verify({
      secret,
      token: code,
    });
    return result.valid;
  }
}
