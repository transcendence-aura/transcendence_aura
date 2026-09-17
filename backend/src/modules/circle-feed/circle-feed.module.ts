import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ProductsModule } from '../products/product.module';
import { CircleFeedResolver } from './circle-feed.resolver';
import { CircleFeedService } from './circle-feed.service';

@Module({
  imports: [PrismaModule, AuthModule, ProductsModule],
  providers: [CircleFeedResolver, CircleFeedService],
})
export class CircleFeedModule {}
