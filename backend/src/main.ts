import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { mkdirSync } from 'node:fs';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { loadSecrets } from './infrastructure/vault/vault-load-secrets';
import { RequiredSecrets } from './config/required-secrets';
import { PUBLIC_UPLOADS_ROOT } from './common/media/media-storage.service';
import { setupSwagger } from './swagger';
import cookieParser from 'cookie-parser';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  let secrets: RequiredSecrets;

  try {
    logger.log('Loading required application secrets from Vault.');
    secrets = await loadSecrets();

    logger.log('Vault authentication and secret validation completed.');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown Vault bootstrap error';
    logger.error(`Startup aborted during Vault bootstrap: ${message}`);
    process.exitCode = 1;
    return;
  }

  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule.register(secrets), {
      bufferLogs: true,
    });

    // nginx is the only hop in front of the backend: trust its
    // X-Forwarded-For so req.ip is the client's address, not nginx's.
    app.set('trust proxy', 1);

    const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];

    app.enableCors({
      origin: allowedOrigins,
      credentials: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.enableShutdownHooks();

    mkdirSync(PUBLIC_UPLOADS_ROOT, { recursive: true });
    app.useStaticAssets(PUBLIC_UPLOADS_ROOT, { prefix: '/uploads' });

    setupSwagger(app);

    const port = parsePort(process.env.PORT);

    app.use(cookieParser());
    await app.listen(port);

    logger.log(`Backend listening on port ${port}`);
  } catch {
    logger.error(`Startup aborted during application initialization.`);
    process.exitCode = 1;
  }
}

function parsePort(value: string | undefined): number {
  const port = Number(value ?? '3001');

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(
      'Invalid application configuration: PORT must be an integer between 1 and 65535',
    );
  }
  return port;
}

void bootstrap();
