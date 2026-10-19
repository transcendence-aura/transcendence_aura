const STORAGE_KEY = 'aura-recent-searches';
const MAX_RECENT_SEARCHES = 5;

export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((term): term is string => typeof term === 'string')
      .slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

export function addRecentSearch(term: string): void {
  const others = getRecentSearches().filter((t) => t.toLowerCase() !== term.toLowerCase());
  const next = [term, ...others].slice(0, MAX_RECENT_SEARCHES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode, quota): recent searches are a convenience only.
  }
}

export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // See addRecentSearch.
  }
}
