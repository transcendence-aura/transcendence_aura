import { Injectable } from '@nestjs/common';
import { VaultRuntimeClient } from './vault-runtime-client';

@Injectable()
export class VaultService {
  constructor(private readonly client: VaultRuntimeClient) {}

  async writeTotpSecret(userId: string, secret: string): Promise<void> {
    await this.client.writeSecret(this.getTotpPath(userId), {
      secret,
    });
  }

  async readTotpSecret(userId: string): Promise<string | null> {
    const data = await this.client.readKvV2Secret(this.getTotpPath(userId));

    const secret = data?.secret;

    return typeof secret === 'string' ? secret : null;
  }

  private getTotpPath(userId: string): string {
    return `aura/development/totp/users/${userId}`;
  }
}
