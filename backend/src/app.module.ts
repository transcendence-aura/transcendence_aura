import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiModule } from './api/api.module';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './database/prisma.module';

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
    HealthModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
