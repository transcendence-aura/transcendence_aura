import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ProductsModule } from '../products/product.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { CircleFeedResolver } from './circle-feed.resolver';
import { CircleFeedService } from './circle-feed.service';

@Module({
  imports: [PrismaModule, AuthModule, ProductsModule, RealtimeModule],
  providers: [CircleFeedResolver, CircleFeedService],
  exports: [CircleFeedService],
})
export class CircleFeedModule {}
