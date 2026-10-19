const MAX_QUERY_LENGTH = 200;

// Search is ASCII-only for now. Accents are stripped (like the backend does), then anything
// that is not an ASCII letter or digit becomes a space. Returns null when nothing searchable
// is left (e.g. Arabic or symbols only), so the caller can show "no results" without a request:
// the backend would ignore such a term and return the whole catalogue.
export function toSearchQuery(term: string): string | null {
  const query = term
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .slice(0, MAX_QUERY_LENGTH);

  return query === '' ? null : query;
}
