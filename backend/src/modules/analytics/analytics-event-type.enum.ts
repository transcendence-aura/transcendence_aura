// The documented list of analytics event types this app records.
// A type must be added here before any code is allowed to emit it.
export enum AnalyticsEventType {
  USER_REGISTERED = 'USER_REGISTERED',
  USER_LOGGED_IN = 'USER_LOGGED_IN',
  PRODUCT_VIEWED = 'PRODUCT_VIEWED',
  WISHLIST_ITEM_ADDED = 'WISHLIST_ITEM_ADDED',
  USER_FOLLOWED = 'USER_FOLLOWED',
  MESSAGE_SENT = 'MESSAGE_SENT',
}

export enum AnalyticsTargetType {
  USER = 'USER',
  PRODUCT = 'PRODUCT',
  MESSAGE = 'MESSAGE',
}
