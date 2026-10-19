import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AvatarController } from './avatar.controller';
import { AvatarService } from './avatar.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AvatarController],
  providers: [AvatarService],
})
export class AvatarModule {}
