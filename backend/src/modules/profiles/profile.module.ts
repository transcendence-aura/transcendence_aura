import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { ProductsModule } from '../products/product.module';
import { AuthModule } from '../auth/auth.module';
import { ProfileResolver } from './profile.resolver';
import { ProfileService } from './profile.service';

@Module({
  imports: [PrismaModule, ProductsModule, AuthModule],
  providers: [ProfileResolver, ProfileService],
})
export class ProfileModule {}
