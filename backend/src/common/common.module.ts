import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../modules/auth/auth.module';
import { RolesGuard } from './guards/roles.guard';

// Global so RolesGuard is injectable from any feature module without each
// one re-importing AuthModule just to protect a route or resolver.
@Global()
@Module({
  imports: [AuthModule],
  providers: [RolesGuard],
  exports: [RolesGuard],
})
export class CommonModule {}
