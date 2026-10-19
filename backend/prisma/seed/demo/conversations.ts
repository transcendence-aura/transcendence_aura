import { gql, GraphQLRequestError } from './graphql';
import type { DemoSessions } from './users';

const CONVERSATION_DECLINED_ERROR = 'CONVERSATION_DECLINED';

type Side = 'initiator' | 'recipient';

interface ConversationScript {
  initiator: string;
  recipient: string;
  messages: readonly { from: Side; content: string }[];
  decline?: boolean;
}

// Conversations between mutual followers start ACCEPTED, the others start PENDING.
const conversations: readonly ConversationScript[] = [
  {
    initiator: 'marielaurent',
    recipient: 'sophieb',
    messages: [
      { from: 'initiator', content: 'Hi Sophie! Any cleanser you would trust on sensitive skin?' },
      { from: 'recipient', content: 'The oat cleanser, no doubt. Zero tightness after rinsing.' },
      { from: 'initiator', content: 'Oat again... I keep hearing about it. Fragrance-free?' },
      {
        from: 'recipient',
        content: 'Completely. Patch test it behind the ear first, just in case.',
      },
      { from: 'initiator', content: 'Ordering it tonight, thank you!' },
    ],
  },
  {
    initiator: 'clara',
    recipient: 'marielaurent',
    messages: [
      { from: 'initiator', content: 'Marie, did you try the niacinamide serum yet?' },
      { from: 'recipient', content: 'Two weeks in, my redness is way calmer.' },
      { from: 'initiator', content: 'Morning or evening?' },
      {
        from: 'recipient',
        content: 'Evening, under the night cream. Sunscreen in the morning, always.',
      },
    ],
  },
  {
    initiator: 'arthurd',
    recipient: 'ford_p',
    messages: [
      { from: 'initiator', content: 'Ford, I forgot my moisturizer on a planet. Any advice?' },
      { from: 'recipient', content: 'Always carry a travel size. And a towel, obviously.' },
      { from: 'initiator', content: 'Already got the towel. Is 42 ml enough?' },
      { from: 'recipient', content: 'It is the answer to everything, so yes.' },
    ],
  },
  {
    initiator: 'trillian',
    recipient: 'xavier_n',
    messages: [
      {
        from: 'initiator',
        content: 'Xavier, is this hydrating mist really improbable-glow certified?',
      },
      { from: 'recipient', content: 'Better than that: it is peer-reviewed.' },
      { from: 'initiator', content: 'By whom?' },
      { from: 'recipient', content: 'By a hundred students at 3am. Very thorough people.' },
    ],
  },
  {
    initiator: 'lina42',
    recipient: 'xavier_n',
    messages: [
      {
        from: 'initiator',
        content: 'Hello uncle! My routine is at 12 steps, is the norm okay with that?',
      },
      {
        from: 'recipient',
        content: 'Anything above 25 lines per step and I will have to fail you.',
      },
      { from: 'initiator', content: 'Good thing my serum only has one line then.' },
    ],
  },
  {
    initiator: 'phoenix_m',
    recipient: 'lena_s',
    messages: [
      { from: 'initiator', content: 'Léna, are you filming your routine tomorrow?' },
      { from: 'recipient', content: 'Yes! Situation of the day: the new hair mask.' },
      { from: 'initiator', content: 'I bring the tripod, you bring the good light.' },
    ],
  },
  {
    initiator: 'ford_p',
    recipient: 'phoenix_m',
    messages: [
      {
        from: 'initiator',
        content: 'Hello Phoenix, a friend of mine needs a tutorial on face oils.',
      },
      {
        from: 'recipient',
        content: 'Happy to help! Three drops, warm them between your palms first.',
      },
      { from: 'initiator', content: 'Mostly harmless. Thanks a lot!' },
    ],
  },
  {
    initiator: 'mateo_67',
    recipient: 'lena_s',
    messages: [{ from: 'initiator', content: 'Aura battle? Loser buys the serum. Six, seven.' }],
  },
  {
    initiator: 'laurent-w',
    recipient: 'bruno_l',
    messages: [
      { from: 'initiator', content: 'Bruno, fancy a local cheese and a chat about moisturizers?' },
    ],
    decline: true,
  },
];

const START_CONVERSATION = `
  mutation ($input: StartConversationInput!) {
    startConversation(input: $input) { id status messages { id } }
  }
`;

const ACCEPT_CONVERSATION = `
  mutation ($input: RespondToConversationInput!) {
    acceptConversation(input: $input) { id }
  }
`;

const DECLINE_CONVERSATION = `
  mutation ($input: RespondToConversationInput!) {
    declineConversation(input: $input) { id }
  }
`;

const SEND_MESSAGE = `
  mutation ($input: SendMessageInput!) {
    sendMessage(input: $input) { id }
  }
`;

interface StartedConversation {
  id: string;
  status: string;
  messages: { id: string }[];
}

export async function seedDemoConversations(sessions: DemoSessions): Promise<void> {
  let sent = 0;

  for (const script of conversations) {
    const initiator = sessions.get(script.initiator);
    const recipient = sessions.get(script.recipient);

    if (!initiator || !recipient) {
      throw new Error(`Unknown demo user in ${script.initiator} / ${script.recipient}`);
    }

    let startConversation: StartedConversation;

    try {
      ({ startConversation } = await gql<{ startConversation: StartedConversation }>(
        START_CONVERSATION,
        { input: { otherUserId: recipient.id } },
        initiator.accessToken,
      ));
    } catch (error) {
      // A previous seed run already declined this pair - that's a terminal
      // state the script cannot replay, so treat it as already done.
      if (
        error instanceof GraphQLRequestError &&
        error.message.includes(CONVERSATION_DECLINED_ERROR)
      ) {
        continue;
      }
      throw error;
    }

    if (startConversation.messages.length > 0) {
      continue;
    }

    const conversationId = startConversation.id;
    let status = startConversation.status;

    for (const message of script.messages) {
      const sender = message.from === 'initiator' ? initiator : recipient;

      if (message.from === 'recipient' && status === 'PENDING') {
        await gql(ACCEPT_CONVERSATION, { input: { conversationId } }, recipient.accessToken);
        status = 'ACCEPTED';
      }

      await gql(
        SEND_MESSAGE,
        { input: { conversationId, content: message.content } },
        sender.accessToken,
      );
      sent += 1;
    }

    if (script.decline) {
      await gql(DECLINE_CONVERSATION, { input: { conversationId } }, recipient.accessToken);
    }
  }

  process.stdout.write(`Demo conversations ready (${sent} messages sent)\n`);
}
