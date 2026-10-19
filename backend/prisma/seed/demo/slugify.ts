// Mirrors src/common/utils/slugify.ts: the seed runs from the built image,
// which only ships dist/ and prisma/, so it cannot import backend source
// directly. Keep this in sync if the backend's slugify rules change.
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
