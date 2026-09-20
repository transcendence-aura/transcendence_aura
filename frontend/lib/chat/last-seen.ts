const STORAGE_KEY = 'aura-chat-last-seen';

function readStore(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getLastSeen(conversationId: string): string | null {
  return readStore()[conversationId] ?? null;
}

export function markConversationSeen(conversationId: string): void {
  try {
    const store = readStore();
    store[conversationId] = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* empty */
  }
}
