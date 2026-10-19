import { gql } from './graphql';
import type { DemoSessions } from './users';

// follower handle -> handles followed
const follows: Readonly<Record<string, readonly string[]>> = {
  clara: ['marielaurent', 'phoenix_m', 'lena_s'],
  marielaurent: ['clara', 'sophieb', 'phoenix_m'],
  sophieb: ['marielaurent', 'clara', 'lena_s'],
  arthurd: ['ford_p', 'trillian', 'xavier_n'],
  ford_p: ['arthurd', 'trillian', 'lena_s'],
  trillian: ['ford_p', 'xavier_n', 'phoenix_m'],
  lina42: ['xavier_n', 'phoenix_m', 'lena_s', 'mateo_67'],
  mateo_67: ['lena_s', 'xavier_n', 'lina42'],
  bruno_l: ['xavier_n'],
  lena_s: ['phoenix_m', 'clara'],
  phoenix_m: ['lena_s', 'marielaurent', 'sophieb', 'clara'],
  xavier_n: ['lina42', 'trillian', 'phoenix_m'],
  'laurent-w': ['bruno_l', 'xavier_n'],
};

const FOLLOW_USER = `
  mutation ($input: FollowInput!) {
    followUser(input: $input)
  }
`;

export async function seedDemoFollows(sessions: DemoSessions): Promise<void> {
  let count = 0;

  for (const [followerHandle, followedHandles] of Object.entries(follows)) {
    const follower = sessions.get(followerHandle);

    if (!follower) {
      throw new Error(`Unknown demo user "${followerHandle}"`);
    }

    for (const followedHandle of followedHandles) {
      const followed = sessions.get(followedHandle);

      if (!followed) {
        throw new Error(`Unknown demo user "${followedHandle}"`);
      }

      await gql(FOLLOW_USER, { input: { targetUserId: followed.id } }, follower.accessToken);
      count += 1;
    }
  }

  process.stdout.write(`Demo follows ready (${count})\n`);
}
