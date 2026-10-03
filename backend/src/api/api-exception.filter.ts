import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

const MESSAGES: Record<string, string> = {
  PRODUCT_NOT_FOUND: 'The requested product could not be found.',
  COLLECTION_NOT_FOUND: 'The requested collection could not be found.',
};

const STATUS_ERRORS: Record<number, { code: string; message: string }> = {
  [HttpStatus.BAD_REQUEST]: { code: 'VALIDATION_ERROR', message: 'The request is invalid.' },
  [HttpStatus.UNAUTHORIZED]: { code: 'UNAUTHORIZED', message: 'A valid API key is required.' },
  [HttpStatus.FORBIDDEN]: { code: 'FORBIDDEN', message: 'Access to this resource is forbidden.' },
  [HttpStatus.NOT_FOUND]: {
    code: 'NOT_FOUND',
    message: 'The requested resource could not be found.',
  },
  [HttpStatus.TOO_MANY_REQUESTS]: { code: 'RATE_LIMITED', message: 'Too many requests.' },
};

const INTERNAL_ERROR = { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' };
const REQUEST_ERROR = { code: 'REQUEST_ERROR', message: 'The request could not be processed.' };

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (!(exception instanceof HttpException)) {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
      response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, error: INTERNAL_ERROR });
      return;
    }

    const status = exception.getStatus();
    const body = exception.getResponse();
    const raw = typeof body === 'string' ? body : (body as { message?: unknown }).message;
    const fallback =
      STATUS_ERRORS[status] ??
      (status >= HttpStatus.INTERNAL_SERVER_ERROR ? INTERNAL_ERROR : REQUEST_ERROR);

    let error = fallback;
    if (typeof raw === 'string' && MESSAGES[raw]) {
      error = { code: raw, message: MESSAGES[raw] };
    } else if (status === HttpStatus.BAD_REQUEST && Array.isArray(raw)) {
      error = { code: fallback.code, message: raw.join('; ') };
    } else if (status === HttpStatus.BAD_REQUEST && typeof raw === 'string') {
      error = { code: fallback.code, message: raw };
    }

    response.status(status).json({ success: false, error });
  }
}
