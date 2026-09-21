import { getValidationErrorMessage } from '@/lib/graphql-error';

// Same limits as the backend (UpdateProfileInput).
export const EMAIL_MAX_LENGTH = 320;
export const HANDLE_MAX_LENGTH = 30;
export const BIO_MAX_LENGTH = 500;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Keys of the `ProfileFields` messages: the components translate them, so nothing here is
// tied to a language.
export type FieldErrorCode =
  | 'emailRequired'
  | 'emailInvalid'
  | 'emailTooLong'
  | 'handleRequired'
  | 'handleTooLong'
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

export function validateHandle(value: string): FieldError | undefined {
  const handle = value.trim();

  if (!handle) return { code: 'handleRequired' };
  if (handle.length > HANDLE_MAX_LENGTH) return { code: 'handleTooLong', max: HANDLE_MAX_LENGTH };
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
  // A validation message written by the backend (English only), shown as is when there is one.
  detail?: string;
}

export function getProfileServerError(error: unknown): ProfileServerError {
  const message = getValidationErrorMessage(error);

  if (message === 'EMAIL_UNAVAILABLE') {
    return { field: 'email', error: { code: 'emailUnavailable' } };
  }
  if (message === 'USERNAME_TAKEN') {
    return { field: 'handle', error: { code: 'handleTaken' } };
  }
  return { error: { code: 'updateFailed' }, detail: message };
}

// The backend stores a single `name`: shown split in two fields, as in the design.
export function splitName(name: string): { firstName: string; lastName: string } {
  const [firstName = '', ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}
