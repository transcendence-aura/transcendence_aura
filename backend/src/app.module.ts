import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthResolver } from './graphql/health.resolver';
import { ApiModule } from './api/api.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // Code-first: generate the schema from decorators into this file.
      autoSchemaFile: true,
      // Aphabetically sorted schema output
      sortSchema: true,
      playground: false,
      graphiql: process.env.NODE_ENV !== 'production',
    }),
    ApiModule,
  ],
  controllers: [AppController],
  providers: [AppService, HealthResolver],
})
export class AppModule {}
