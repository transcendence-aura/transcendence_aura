import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RolesGuard } from './guards/roles.guard';

// Global so RolesGuard is injectable from any feature module without each
// one re-importing JwtModule just to protect a route or resolver.
@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [RolesGuard],
  exports: [RolesGuard],
})
export class CommonModule {}
