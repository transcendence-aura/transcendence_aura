import { Module } from '@nestjs/common';
import { loadVaultConfig } from './vault-bootstrap-config';
import { VaultRuntimeClient } from './vault-runtime-client';
import { VaultService } from './vault.service';

@Module({
  providers: [
    {
      provide: VaultRuntimeClient,
      useFactory: async () => {
        const config = await loadVaultConfig();
        return new VaultRuntimeClient(config);
      },
    },
    VaultService,
  ],
  exports: [VaultService],
})
export class VaultModule {}
