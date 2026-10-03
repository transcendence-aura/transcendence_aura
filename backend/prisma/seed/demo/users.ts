import { GraphQLRequestError, gql } from './graphql';

export interface DemoUser {
  name: string;
  email: string;
  handle: string;
  bio: string;
}

export const demoUsers: readonly DemoUser[] = [
  {
    name: 'Clara L',
    email: 'clara@example.com',
    handle: 'clara',
    bio: 'Skincare enthusiast',
  },
  {
    name: 'Marie Laurent',
    email: 'marie@example.com',
    handle: 'marielaurent',
    bio: 'Clean beauty enthusiast - sensitive skin',
  },
  {
    name: 'Sophie B',
    email: 'sophie@example.com',
    handle: 'sophieb',
    bio: 'Minimalist beauty and skincare advocate',
  },
  {
    name: 'Arthur D',
    email: 'arthur@example.com',
    handle: 'arthurd',
    bio: 'Skincare for the average hitchhiker. Always knows where his towel is.',
  },
  {
    name: 'Trillian M',
    email: 'trillian@example.com',
    handle: 'trillian',
    bio: 'Astrophysicist by day, serum nerd by night. Improbable glow guaranteed.',
  },
  {
    name: 'Ford P',
    email: 'ford@example.com',
    handle: 'ford_p',
    bio: 'Field researcher. Mostly harmless formulas only.',
  },
  {
    name: 'Lina Q',
    email: 'lina@example.com',
    handle: 'lina42',
    bio: 'Piscine survivor. My moisturizer is norminette-compliant.',
  },
  {
    name: 'Mateo R',
    email: 'mateo@example.com',
    handle: 'mateo_67',
    bio: 'Glow is a competitive sport. Undefeated in face-offs, dab included.',
  },
  {
    name: 'Bruno L',
    email: 'bruno@example.com',
    handle: 'bruno_l',
    bio: 'Balanced budgets, unbalanced pigmentation. Ask me about brown bumps.',
  },
  {
    name: 'Léna S',
    email: 'lena@example.com',
    handle: 'lena_s',
    bio: 'A new situation every day, a new serum every week. Vlog first, routine second.',
  },
  {
    name: 'Phoenix M',
    email: 'phoenix@example.com',
    handle: 'phoenix_m',
    bio: 'Tutorials since the early days. Rises from every bad skin day.',
  },
  {
    name: 'Xavier N',
    email: 'xavier@example.com',
    handle: 'xavier_n',
    bio: 'Started on 3615, now on 5G. Runs a school with no teachers, so my routine is peer-reviewed. Call me uncle, everyone does.',
  },
  {
    name: 'Laurent W',
    email: 'laurent@example.com',
    handle: 'laurent-w',
    bio: 'Local products first. Fleece all winter, moisturizer all year.',
  },
];

const REGISTER = `
  mutation ($input: RegisterDto!) {
    register(input: $input) { id }
  }
`;

const LOGIN = `
  mutation ($input: LoginInput!) {
    login(input: $input) { accessToken }
  }
`;

const UPDATE_PROFILE = `
  mutation ($input: UpdateProfileInput!) {
    updateMyProfile(input: $input) { id }
  }
`;

export interface DemoSession {
  id: string;
  accessToken: string;
}

export type DemoSessions = ReadonlyMap<string, DemoSession>;

const ME = `
  query {
    me { id }
  }
`;

export async function seedDemoUsers(password: string): Promise<DemoSessions> {
  const sessions = new Map<string, DemoSession>();

  for (const user of demoUsers) {
    try {
      await gql(REGISTER, { input: { email: user.email, name: user.name, password } });
    } catch (error: unknown) {
      if (
        !(error instanceof GraphQLRequestError) ||
        !error.message.includes('EMAIL_ALREADY_EXISTS')
      ) {
        throw error;
      }
    }

    const { login } = await gql<{ login: { accessToken?: string } }>(LOGIN, {
      input: { email: user.email, password },
    });

    if (!login.accessToken) {
      throw new Error(`Login of ${user.email} did not return an access token`);
    }

    await gql(UPDATE_PROFILE, { input: { handle: user.handle, bio: user.bio } }, login.accessToken);

    const { me } = await gql<{ me: { id: string } }>(ME, {}, login.accessToken);

    sessions.set(user.handle, { id: me.id, accessToken: login.accessToken });
    process.stdout.write(`Demo user ${user.email} ready\n`);
  }

  return sessions;
}
