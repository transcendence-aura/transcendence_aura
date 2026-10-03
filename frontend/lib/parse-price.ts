// type="number" inputs silently drop a "," keystroke instead of treating it
// as a decimal separator (24,99 becomes 2499, with no warning) - so price
// fields use a plain text input and parse/validate the value here instead.
export function parsePriceInput(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.');
  if (normalized === '') return null;

  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;

  // Matches the backend's @IsNumber({ maxDecimalPlaces: 2 }) constraint.
  return Math.round(value * 100) / 100;
}
