// Where to send the user once signed in, from the `returnTo` the proxy (or a page) put in the URL.
// Only a path inside the app is accepted: anything else could send them to another site.
export function getSafeReturnTo(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/';
  }
  return value;
}
