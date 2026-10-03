import type { SeedConfig } from '../config';
import { loginAsAdmin } from './admin-session';
import { seedDemoAvatars } from './avatars';
import { seedDemoConversations } from './conversations';
import { seedDemoProducts } from './products';
import { seedDemoWishlists } from './wishlists';
import { seedDemoFollows } from './follows';
import { waitForBackend } from './graphql';
import { seedDemoUsers } from './users';

export async function seedDemo(config: SeedConfig): Promise<void> {
  await waitForBackend();

  const sessions = await seedDemoUsers(config.demoPassword);

  await seedDemoAvatars(sessions);
  await seedDemoFollows(sessions);
  await seedDemoConversations(sessions);

  const adminToken = await loginAsAdmin(config);
  const productIds = await seedDemoProducts(adminToken);
  await seedDemoWishlists(sessions, productIds);
}
