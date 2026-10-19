import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { uploadFile } from './graphql';
import type { DemoSessions } from './users';

const AVATARS_DIR = path.resolve(process.cwd(), 'prisma/seed/demo/avatars');

async function readAvatar(handle: string): Promise<Buffer | null> {
  try {
    return await readFile(path.join(AVATARS_DIR, `${handle}.jpg`));
  } catch {
    return null;
  }
}

export async function seedDemoAvatars(sessions: DemoSessions): Promise<void> {
  let uploaded = 0;

  for (const [handle, session] of sessions) {
    const content = await readAvatar(handle);

    if (!content) {
      continue;
    }

    await uploadFile(
      '/v1/users/me/avatar',
      { content, filename: `${handle}.jpg`, mimeType: 'image/jpeg' },
      session.accessToken,
    );
    uploaded += 1;
  }

  process.stdout.write(`Demo avatars ready (${uploaded})\n`);
}
