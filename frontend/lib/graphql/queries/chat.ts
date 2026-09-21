import { gql, type TypedDocumentNode } from '@apollo/client';

export interface ConversationParticipant {
  id: string;
  name: string;
}

export interface ChatMessage {
  id: string;
  senderId?: string;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  status: 'ACCEPTED' | 'PENDING' | 'DECLINED';
  initiatorId: string;
  userOne: ConversationParticipant;
  userTwo: ConversationParticipant;
  messages: ChatMessage[];
}

const CONVERSATION_FIELDS = `
  id
  status
  initiatorId
  userOne {
    id
    name
  }
  userTwo {
    id
    name
  }
  messages {
    id
    senderId
    content
    createdAt
  }
`;

export interface ConversationsQueryData {
  conversations: Conversation[];
}

export const CONVERSATIONS_QUERY: TypedDocumentNode<ConversationsQueryData> = gql`
  query Conversations {
    conversations {
      ${CONVERSATION_FIELDS}
    }
  }
`;

export interface PendingConversationsQueryData {
  pendingConversations: Conversation[];
}

export const PENDING_CONVERSATIONS_QUERY: TypedDocumentNode<PendingConversationsQueryData> = gql`
  query PendingConversations {
    pendingConversations {
      ${CONVERSATION_FIELDS}
    }
  }
`;

export interface RespondToConversationVariables {
  input: { conversationId: string };
}

export interface RespondToConversationData {
  acceptConversation?: Conversation;
  declineConversation?: Conversation;
}

export const ACCEPT_CONVERSATION_MUTATION: TypedDocumentNode<
  RespondToConversationData,
  RespondToConversationVariables
> = gql`
  mutation AcceptConversation($input: RespondToConversationInput!) {
    acceptConversation(input: $input) {
      ${CONVERSATION_FIELDS}
    }
  }
`;

export const DECLINE_CONVERSATION_MUTATION: TypedDocumentNode<
  RespondToConversationData,
  RespondToConversationVariables
> = gql`
  mutation DeclineConversation($input: RespondToConversationInput!) {
    declineConversation(input: $input) {
      id
      status
    }
  }
`;

export interface SendMessageData {
  sendMessage: ChatMessage;
}

export interface SendMessageVariables {
  input: {
    conversationId: string;
    content: string;
  };
}

export const SEND_MESSAGE_MUTATION: TypedDocumentNode<SendMessageData, SendMessageVariables> = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      id
      senderId
      content
      createdAt
    }
  }
`;
