// The design-system classes (text-body-base, text-ui-label, text-display-title, font-cormorant...)
// currently generate no CSS: the tokens are declared as --font-size-* / --font-family-* in
// globals.css, which Tailwind v4 does not turn into utilities. Until that is fixed for the whole
// app, the settings page applies the tokens through arbitrary values.
//
// Sizes are one step above the raw tokens (9-12px), which read too small next to the rest of the
// app (the pages using the inactive classes fall back to the browser's 16px). Weight, line height
// and letter spacing still come from the tokens.

export const FONT_SANS = 'font-[family-name:var(--font-family-jost)]';

export const TEXT_TITLE =
  'font-[family-name:var(--font-family-cormorant)] text-[length:var(--font-size-display-title)] leading-[var(--line-height-display-title)] font-[weight:var(--font-weight-display-title)]';

export const TEXT_LABEL =
  'text-xs leading-[var(--line-height-ui-label)] font-[weight:var(--font-weight-ui-label)] tracking-[var(--letter-spacing-ui-label)] uppercase';

export const TEXT_BODY =
  'text-sm leading-[var(--line-height-body-base)] font-[weight:var(--font-weight-body-base)]';

export const TEXT_BODY_SM =
  'text-xs leading-[var(--line-height-body-sm)] font-[weight:var(--font-weight-body-sm)]';

export const TEXT_BUTTON =
  'text-xs leading-[var(--line-height-ui-button)] font-[weight:var(--font-weight-ui-button)] tracking-[var(--letter-spacing-ui-button)] uppercase';

export const TEXT_BADGE =
  'text-xs leading-[var(--line-height-ui-badge)] font-[weight:var(--font-weight-ui-badge)] tracking-[var(--letter-spacing-ui-badge)] uppercase';

export const TEXT_SUBTITLE =
  'font-[family-name:var(--font-family-cormorant)] text-[length:var(--font-size-display-subtitle)] leading-[var(--line-height-display-subtitle)] font-[weight:var(--font-weight-display-subtitle)]';

export const TEXT_STAT =
  'font-[family-name:var(--font-family-cormorant)] text-[length:var(--font-size-display-stat)] leading-[var(--line-height-display-stat)] font-[weight:var(--font-weight-display-stat)]';
