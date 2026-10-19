import { gql, type TypedDocumentNode } from '@apollo/client';

export type NotificationKind = 'MESSAGE' | 'FOLLOW' | 'WISHLIST' | 'SYSTEM';

// Must match the constant of the same name in
// backend/src/modules/notifications/notification-markers.ts.
export const CONVERSATION_REQUEST_MARKER = 'CONVERSATION_REQUEST';

export interface NotificationActor {
  id: string;
  name: string;
  handle: string;
}

export interface Notification {
  id: string;
  type: NotificationKind;
  userId: string;
  actorId?: string;
  actor?: NotificationActor;
  title?: string;
  body?: string;
  readAt?: string;
  createdAt: string;
}

export interface NotificationsQueryData {
  notifications: Notification[];
}

export interface NotificationsQueryVariables {
  unreadOnly?: boolean;
}

export const NOTIFICATIONS_QUERY: TypedDocumentNode<
  NotificationsQueryData,
  NotificationsQueryVariables
> = gql`
  query Notifications($unreadOnly: Boolean) {
    notifications(unreadOnly: $unreadOnly) {
      id
      type
      userId
      actorId
      actor {
        id
        name
        handle
      }
      title
      body
      readAt
      createdAt
    }
  }
`;

export interface MarkAllNotificationsReadData {
  markAllNotificationsRead: number;
}

export const MARK_ALL_NOTIFICATIONS_READ_MUTATION: TypedDocumentNode<MarkAllNotificationsReadData> = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;
