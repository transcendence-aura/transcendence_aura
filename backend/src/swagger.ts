import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { ApiModule } from './api/api.module';
import { ApiKeyModule } from './modules/api-keys/api-key.module';

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
        '(see the ApiKeyAuth security scheme). Keys are self-service: authenticate with a ' +
        'normal account (ApiKeyManagementAuth) against the /api/keys endpoints to obtain one.',
    )
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'ApiKeyAuth')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'ApiKeyManagementAuth')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    include: [ApiModule, ApiKeyModule],
  });

  SwaggerModule.setup('docs', app, document);
}
