import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../modules/auth/auth.module';
import { RolesGuard } from './guards/roles.guard';
import { ApiKeyGuard } from './guards/api-key.guard';
import { MediaStorageService } from './media/media-storage.service';

@Global()
@Module({
  imports: [AuthModule],
  providers: [RolesGuard, ApiKeyGuard, MediaStorageService],
  exports: [RolesGuard, ApiKeyGuard, MediaStorageService],
})
export class CommonModule {}
