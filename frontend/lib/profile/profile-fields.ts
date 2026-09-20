import { getValidationErrorMessage } from '@/lib/graphql-error';

// Same limits as the backend (UpdateProfileInput).
export const EMAIL_MAX_LENGTH = 320;
export const HANDLE_MAX_LENGTH = 30;
export const BIO_MAX_LENGTH = 500;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | undefined {
  const email = value.trim();

  if (!email) return 'Email is required.';
  if (!EMAIL_PATTERN.test(email)) return 'Please enter a valid email address.';
  if (email.length > EMAIL_MAX_LENGTH) {
    return `Email must not exceed ${EMAIL_MAX_LENGTH} characters.`;
  }
  return undefined;
}

export function validateHandle(value: string): string | undefined {
  const handle = value.trim();

  if (!handle) return 'Handle is required.';
  if (handle.length > HANDLE_MAX_LENGTH) {
    return `Handle must not exceed ${HANDLE_MAX_LENGTH} characters.`;
  }
  return undefined;
}

export function validateBio(value: string): string | undefined {
  if (value.length > BIO_MAX_LENGTH) return `Bio must not exceed ${BIO_MAX_LENGTH} characters.`;
  return undefined;
}

export interface ProfileServerError {
  // The field the error belongs to, when the server said which one.
  field?: 'email' | 'handle';
  message: string;
}

export function getProfileServerError(error: unknown): ProfileServerError {
  const message = getValidationErrorMessage(error);

  if (message === 'EMAIL_UNAVAILABLE') {
    return { field: 'email', message: 'This email is already in use.' };
  }
  if (message === 'USERNAME_TAKEN') {
    return { field: 'handle', message: 'This handle is already taken.' };
  }
  return { message: message ?? 'Unable to update your profile. Please try again.' };
}

// The backend stores a single `name`: shown split in two fields, as in the design.
export function splitName(name: string): { firstName: string; lastName: string } {
  const [firstName = '', ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}
