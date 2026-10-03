// Title marker for a MESSAGE notification that represents a new conversation
// request rather than an actual message - there's no dedicated NotificationType
// enum value for it (would require a migration). Must match the constant of
// the same name in frontend/lib/graphql/queries/notifications.ts.
export const CONVERSATION_REQUEST_MARKER = 'CONVERSATION_REQUEST';
