import { gql, type TypedDocumentNode } from '@apollo/client';

export type NotificationKind = 'MESSAGE' | 'FOLLOW' | 'WISHLIST' | 'SYSTEM';

export interface Notification {
  id: string;
  type: NotificationKind;
  userId: string;
  actorId?: string;
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
