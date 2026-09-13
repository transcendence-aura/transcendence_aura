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
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { AdminUserModule } from './modules/admin-user/admin-user.module';
import { AdminProductModule } from './modules/admin-product/admin-product.module';
import { AdminCollectionModule } from './modules/admin-collection/admin-collection.module';
import { AdminCategoryModule } from './modules/admin-category/admin-category.module';
import { AdminProductFamilyModule } from './modules/admin-product-family/admin-product-family.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AnalyticsReportsModule } from './modules/analytics-reports/analytics-reports.module';
import { FollowModule } from './modules/follows/follow.module';
import { ProfileModule } from './modules/profiles/profile.module';
import { NotificationModule } from './modules/notifications/notification.module';
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
          context: ({ req, res }: { req: unknown; res: unknown }) => ({ req, res }),
        }),
        ApiModule,
        HealthModule,
        PrismaModule,
        ProductsModule,
        AuthModule,
        CollectionsModule,
        RealtimeModule,
        ConversationModule,
        WishlistModule,
        AdminUserModule,
        AdminProductModule,
        AdminCollectionModule,
        AdminCategoryModule,
        AdminProductFamilyModule,
        AnalyticsModule,
        AnalyticsReportsModule,
        FollowModule,
        ProfileModule,
        NotificationModule,
        CommonModule,
      ],
      controllers: [AppController],
      providers: [AppService],
    };
  }
}
