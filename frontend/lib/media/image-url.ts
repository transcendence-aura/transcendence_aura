// A relative URL (e.g. `/api/uploads/...`, an uploaded product photo) can only be reached by the
// browser: nginx is what knows how to route it to the backend. Next's image optimizer would try
// to fetch it itself from inside the frontend container, which has no route for it, and reject
// the result - so those images must skip optimization and be requested by the browser as is.
// Absolute URLs (an external host) go through the normal optimizer unaffected.
export function isLocalMediaUrl(url: string): boolean {
  return url.startsWith('/');
}
