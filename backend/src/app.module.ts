import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PingResolver } from './graphql/ping.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // Code-first: generate the schema from decorators into this file.
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      // Aphabetically sorted schema output
      sortSchema: true,
      playground: false,
      graphiql: process.env.NODE_ENV !== 'production',
    }),
  ],
  controllers: [AppController],
  providers: [AppService, PingResolver],
})
export class AppModule {}
