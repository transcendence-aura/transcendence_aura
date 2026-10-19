import { getValidationErrorMessage } from '@/lib/graphql-error';

// Same limits as the backend (UpdateProfileInput).
export const EMAIL_MAX_LENGTH = 320;
export const HANDLE_MAX_LENGTH = 30;
export const BIO_MAX_LENGTH = 500;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Usable in a profile URL. Same rule as the backend (UpdateProfileInput).
const HANDLE_PATTERN = /^[a-z0-9_-]+$/;

// Keys of the `ProfileFields` messages: the components translate them, so nothing here is
// tied to a language.
export type FieldErrorCode =
  | 'emailRequired'
  | 'emailInvalid'
  | 'emailTooLong'
  | 'handleRequired'
  | 'handleTooLong'
  | 'handleInvalid'
  | 'bioTooLong'
  | 'emailUnavailable'
  | 'handleTaken'
  | 'updateFailed';

export interface FieldError {
  code: FieldErrorCode;
  // The limit, for the messages that mention it.
  max?: number;
}

export function validateEmail(value: string): FieldError | undefined {
  const email = value.trim();

  if (!email) return { code: 'emailRequired' };
  if (!EMAIL_PATTERN.test(email)) return { code: 'emailInvalid' };
  if (email.length > EMAIL_MAX_LENGTH) return { code: 'emailTooLong', max: EMAIL_MAX_LENGTH };
  return undefined;
}

// Handles are lowercase: what the user types is normalized before it is checked and sent.
export function normalizeHandle(value: string): string {
  return value.trim().toLowerCase();
}

export function validateHandle(value: string): FieldError | undefined {
  const handle = normalizeHandle(value);

  if (!handle) return { code: 'handleRequired' };
  if (handle.length > HANDLE_MAX_LENGTH) return { code: 'handleTooLong', max: HANDLE_MAX_LENGTH };
  if (!HANDLE_PATTERN.test(handle)) return { code: 'handleInvalid' };
  return undefined;
}

export function validateBio(value: string): FieldError | undefined {
  if (value.length > BIO_MAX_LENGTH) return { code: 'bioTooLong', max: BIO_MAX_LENGTH };
  return undefined;
}

export interface ProfileServerError {
  // The field the error belongs to, when the server said which one.
  field?: 'email' | 'handle';
  error: FieldError;
}

export function getProfileServerError(error: unknown): ProfileServerError {
  const message = getValidationErrorMessage(error);

  if (message === 'EMAIL_UNAVAILABLE') {
    return { field: 'email', error: { code: 'emailUnavailable' } };
  }
  if (message === 'USERNAME_TAKEN') {
    return { field: 'handle', error: { code: 'handleTaken' } };
  }
  // Anything else (rate limit, expired session, validation...): the backend's own messages are
  // English only, so they are not shown.
  return { error: { code: 'updateFailed' } };
}

// The backend stores a single `name`: shown split in two fields, as in the design.
export function splitName(name: string): { firstName: string; lastName: string } {
  const [firstName = '', ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}
