// A stand-in origin to parse against: only used to tell "inside the app" from "another site".
const APP_ORIGIN = 'http://app.invalid';

// Where to send the user once signed in, from the `returnTo` the proxy (or a page) put in the URL.
// Only a path inside the app is accepted: anything else could send them to another site.
// Parsed the way a browser reads it (tabs and newlines dropped, `\` read as `/`), instead of
// filtering the raw text.
export function getSafeReturnTo(value: string | null): string {
  if (!value || !value.startsWith('/')) return '/';

  try {
    const url = new URL(value, APP_ORIGIN);
    const path = `${url.pathname}${url.search}${url.hash}`;

    // `/.//evil.com` normalizes to `//evil.com`, which a browser reads as another site.
    if (url.origin !== APP_ORIGIN || path.startsWith('//')) return '/';
    return path;
  } catch {
    return '/';
  }
}
