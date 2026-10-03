import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiProperty,
  getSchemaPath,
  ApiResponse,
  ApiResponseSchemaHost,
} from '@nestjs/swagger';
import { API_RATE_LIMIT } from './api-rate-limit';

export interface ApiMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: ApiMeta;
}

export function ok<T>(data: T): ApiSuccess<T> {
  return { success: true, data };
}

export function paginated<T>(
  data: T[],
  page: number,
  limit: number,
  totalItems: number,
): ApiSuccess<T[]> {
  return {
    success: true,
    data,
    meta: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
  };
}

export function slicePage<T>(items: T[], page: number, limit: number): ApiSuccess<T[]> {
  const start = (page - 1) * limit;
  return paginated(items.slice(start, start + limit), page, limit, items.length);
}

export class ApiMetaDto implements ApiMeta {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalItems!: number;

  @ApiProperty()
  totalPages!: number;
}

export class ApiErrorBodyDto {
  @ApiProperty({ description: 'Stable machine-readable error code.' })
  code!: string;

  @ApiProperty({ description: 'Human-readable explanation.' })
  message!: string;
}

export class ApiErrorDto {
  @ApiProperty({ example: false })
  success!: false;

  @ApiProperty({ type: ApiErrorBodyDto })
  error!: ApiErrorBodyDto;
}

type ApiResponseHeaders = NonNullable<Parameters<typeof ApiResponse>[0]['headers']>;

const RATE_LIMIT_WINDOW_SECONDS = API_RATE_LIMIT.ttlMs / 1000;

export const RATE_LIMIT_HEADERS: ApiResponseHeaders = {
  'X-RateLimit-Limit': {
    description: 'Requests allowed per window for this API key.',
    schema: { type: 'integer', example: API_RATE_LIMIT.limit },
  },
  'X-RateLimit-Remaining': {
    description: 'Requests left in the current window.',
    schema: { type: 'integer', example: API_RATE_LIMIT.limit - 1 },
  },
  'X-RateLimit-Reset': {
    description: 'Seconds until the current window resets.',
    schema: { type: 'integer', example: RATE_LIMIT_WINDOW_SECONDS },
  },
};

export const RETRY_AFTER_HEADER: ApiResponseHeaders = {
  'Retry-After': {
    description: 'Seconds to wait before sending another request.',
    schema: { type: 'integer', example: RATE_LIMIT_WINDOW_SECONDS },
  },
};

export function ApiEnvelopeResponse(
  model: Type<unknown>,
  options: { list?: boolean; created?: boolean; description?: string } = {},
) {
  const data = options.list
    ? { type: 'array', items: { $ref: getSchemaPath(model) } }
    : { $ref: getSchemaPath(model) };
  const properties: ApiResponseSchemaHost['schema']['properties'] = {
    success: { type: 'boolean', example: true },
    data,
  };
  if (options.list) properties.meta = { $ref: getSchemaPath(ApiMetaDto) };
  const SuccessResponse = options.created ? ApiCreatedResponse : ApiOkResponse;

  return applyDecorators(
    ApiExtraModels(model, ApiMetaDto),
    SuccessResponse({
      description: options.description,
      headers: RATE_LIMIT_HEADERS,
      schema: { type: 'object', properties },
    }),
  );
}

export function ApiErrorResponse(
  status: number,
  description: string,
  code: string,
  message: string,
  headers?: ApiResponseHeaders,
) {
  return applyDecorators(
    ApiExtraModels(ApiErrorDto),
    ApiResponse({
      status,
      description,
      headers,
      schema: {
        allOf: [{ $ref: getSchemaPath(ApiErrorDto) }],
        example: { success: false, error: { code, message } },
      },
    }),
  );
}
