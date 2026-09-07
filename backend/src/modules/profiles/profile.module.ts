import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { ProductsModule } from '../products/product.module';
import { ProfileResolver } from './profile.resolver';
import { ProfileService } from './profile.service';

@Module({
  imports: [PrismaModule, ProductsModule],
  providers: [ProfileResolver, ProfileService],
})
export class ProfileModule {}
