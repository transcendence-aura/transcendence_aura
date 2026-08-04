import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { loadSecrets } from './infrastructure/vault/vault-load-secrets';
import { RequiredSecrets } from './config/required-secrets';

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
    const app = await NestFactory.create(AppModule.register(secrets), {
      bufferLogs: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.enableShutdownHooks();

    const port = parsePort(process.env.PORT);

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
