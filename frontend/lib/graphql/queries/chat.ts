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
  userOne: ConversationParticipant;
  userTwo: ConversationParticipant;
  messages: ChatMessage[];
}

export interface ConversationsQueryData {
  conversations: Conversation[];
}

export const CONVERSATIONS_QUERY: TypedDocumentNode<ConversationsQueryData> = gql`
  query Conversations {
    conversations {
      id
      status
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
