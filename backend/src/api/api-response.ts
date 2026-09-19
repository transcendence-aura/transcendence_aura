import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiProperty,
  getSchemaPath,
  ApiResponseSchemaHost,
} from '@nestjs/swagger';

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
  @ApiProperty({ example: 'PRODUCT_NOT_FOUND' })
  code!: string;

  @ApiProperty({ example: 'The requested product could not be found.' })
  message!: string;
}

export class ApiErrorDto {
  @ApiProperty({ example: false })
  success!: false;

  @ApiProperty({ type: ApiErrorBodyDto })
  error!: ApiErrorBodyDto;
}

export function ApiEnvelopeResponse(model: Type<unknown>, options: { list?: boolean } = {}) {
  const data = options.list
    ? { type: 'array', items: { $ref: getSchemaPath(model) } }
    : { $ref: getSchemaPath(model) };
  const properties: ApiResponseSchemaHost['schema']['properties'] = {
    success: { type: 'boolean', example: true },
    data,
  };
  if (options.list) properties.meta = { $ref: getSchemaPath(ApiMetaDto) };

  return applyDecorators(
    ApiExtraModels(model, ApiMetaDto),
    ApiOkResponse({ schema: { type: 'object', properties } }),
  );
}
