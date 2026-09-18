import { CombinedGraphQLErrors } from '@apollo/client';

// NestJS's ValidationPipe puts the actual class-validator message(s) in
// extensions.originalError.message (a string, or an array when multiple
// constraints fail) - surfaced here instead of a generic "failed" toast.
export function getValidationErrorMessage(error: unknown): string | undefined {
  if (!CombinedGraphQLErrors.is(error)) return undefined;

  for (const graphQLError of error.errors) {
    const originalError = graphQLError.extensions?.originalError as
      { message?: string | string[] } | undefined;
    const message = originalError?.message;

    if (typeof message === 'string') return message;
    if (Array.isArray(message) && message.length > 0) return message[0];
  }

  return undefined;
}
