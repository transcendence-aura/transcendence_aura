import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../modules/auth/auth.module';
import { RolesGuard } from './guards/roles.guard';
import { MediaStorageService } from './media/media-storage.service';

// Global so RolesGuard is injectable from any feature module without each
// one re-importing AuthModule just to protect a route or resolver.
@Global()
@Module({
  imports: [AuthModule],
  providers: [RolesGuard, MediaStorageService],
  exports: [RolesGuard, MediaStorageService],
})
export class CommonModule {}
