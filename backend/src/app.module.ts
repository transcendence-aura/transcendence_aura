import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiModule } from './api/api.module';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './database/prisma.module';
import { ProductsModule } from './modules/products/product.module';
import { AuthModule } from './modules/auth/auth.module';
import { CollectionsModule } from './modules/collections/collection.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { ConversationModule } from './modules/conversations/conversation.module';
import { CommonModule } from './common/common.module';
import { createAppConfig } from './config/configuration';
import { RequiredSecrets } from './config/required-secrets';

@Module({})
export class AppModule {
  static register(secrets: RequiredSecrets): DynamicModule {
    return {
      module: AppModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: process.env.NODE_ENV === 'production',
          load: [() => createAppConfig(secrets)],
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          // Code-first: generate the schema from decorators into this file.
          autoSchemaFile: true,
          // Aphabetically sorted schema output
          sortSchema: true,
          playground: false,
          graphiql: process.env.NODE_ENV !== 'production',
          includeStacktraceInErrorResponses: false,
          // Exposes the raw HTTP request in resolver context so guards can
          // read the Authorization header (RolesGuard relies on this).
          context: ({ req }: { req: unknown }) => ({ req }),
        }),
        ApiModule,
        HealthModule,
        PrismaModule,
        ProductsModule,
        AuthModule,
        CollectionsModule,
        RealtimeModule,
        ConversationModule,
        CommonModule,
      ],
      controllers: [AppController],
      providers: [AppService],
    };
  }
}
