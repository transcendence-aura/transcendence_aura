import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { ApiModule } from './api/api.module';
import { API_RATE_LIMIT } from './api/api-rate-limit';
import { ApiKeyModule } from './modules/api-keys/api-key.module';
import { SWAGGER_CUSTOM_CSS } from './swagger-theme';

// Scoped to just the public /api/v1 surface and the key management
// endpoints that hand out credentials for it - not the whole backend
// (GraphQL, admin, auth, ...), which this Public API deliberately excludes.
//
// setup() is called with 'docs', not 'api/docs': nginx's `location /api/`
// strips the /api/ prefix before proxying to the backend, so the
// client-facing https://.../api/docs maps to this app's /docs.
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('AURA Public API')
    .setDescription(
      'Catalogue-only, read-only public API. Requests to /api/v1/* require an API key ' +
        'sent in the X-API-Key header. Keys are self-service: log in with a normal account, ' +
        'call POST /api/keys (ApiKeyManagementAuth) to create one, then click Authorize and ' +
        'paste it under ApiKeyAuth to try the routes from this page.\n\n' +
        'Every response uses the same envelope: `{ success: true, data, meta? }` on success, ' +
        '`{ success: false, error: { code, message } }` on failure. List routes accept ' +
        '`page` (default 1) and `limit` (default 25, max 100) and return ' +
        '`meta: { page, limit, totalItems, totalPages }`.\n\n' +
        `Rate limit: ${API_RATE_LIMIT.limit} requests per ${API_RATE_LIMIT.ttlMs / 1000} seconds ` +
        'per API key, shared across all routes. Every response carries `X-RateLimit-Limit`, ' +
        '`X-RateLimit-Remaining` and `X-RateLimit-Reset`. Beyond the limit the API answers ' +
        '429 `RATE_LIMITED` with a `Retry-After` header (seconds to wait).',
    )
    .setVersion('1.0')
    .addServer('/api', 'Public entry point (nginx strips the /api prefix)')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API key created with POST /api/keys. Sent as the X-API-Key header.',
      },
      'ApiKeyAuth',
    )
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'ApiKeyManagementAuth')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    include: [ApiModule, ApiKeyModule],
  });

  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'AURA Public API',
    customfavIcon: '/favicon.ico',
    customCss: SWAGGER_CUSTOM_CSS,
  });
}
