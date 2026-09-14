import { BadRequestException, Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

import { PrismaService } from '../../database/prisma.service';
import { VaultService } from '../../infrastructure/vault/vault.service';
import { TotpService } from './totp.service';

@Injectable()
export class TwoFactorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly totpService: TotpService,
    private readonly vaultService: VaultService,
  ) {}

  async beginEnrollment(userId: string): Promise<{
    provisioningUri: string;
    qrCode: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled.');
    }

    const secret = this.totpService.generateSecret();

    await this.vaultService.writeTotpSecret(user.id, secret);

    const provisioningUri = this.totpService.generateProvisioningUri({
      email: user.email,
      secret,
    });

    const qrCode = await QRCode.toDataURL(provisioningUri);

    return { provisioningUri, qrCode };
  }

  async confirmEnrollment(
    userId: string,
    code: string,
  ): Promise<{
    enabled: true;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled.');
    }

    const secret = await this.vaultService.readTotpSecret(user.id);

    if (!secret) {
      throw new BadRequestException('Two-factor authentication enrollment has not been started.');
    }

    const valid = await this.totpService.verifyCode(secret, code);

    if (!valid) {
      throw new BadRequestException('Invalid authentication code.');
    }

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        twoFactorEnabled: true,
        twoFactorEnabledAt: new Date(),
      },
    });

    return { enabled: true };
  }
}
