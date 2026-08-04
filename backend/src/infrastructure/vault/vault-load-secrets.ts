import { RequiredSecrets } from '../../config/required-secrets';
import { VaultBootstrapClient } from './vault-bootstrap-client';
import { loadVaultConfig } from './vault-bootstrap-config';

export async function loadSecrets(): Promise<RequiredSecrets> {
  const bootstrapConfig = await loadVaultConfig();
  const client = new VaultBootstrapClient(bootstrapConfig);
  return client.loadRequiredSecrets();
}
