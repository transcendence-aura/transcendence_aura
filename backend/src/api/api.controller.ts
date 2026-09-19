import { Controller, Get, NotImplementedException, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

// Every route answers 501 until the real endpoints are built. All of
// /api/v1/* requires a valid API key (see ApiKeyGuard).
//
// Controller path is 'v1', not 'api/v1': nginx's `location /api/` strips
// the /api/ prefix before proxying to the backend (see nginx/nginx.conf),
// so a client-facing /api/v1/status maps to this app's /v1/status - same
// convention already used by AvatarController and AdminProductImageController.
@ApiTags('Public API')
@ApiSecurity('ApiKeyAuth')
@Controller('v1')
@UseGuards(ApiKeyGuard)
export class ApiController {
  @Get('status')
  @ApiOperation({ summary: 'Public API status' })
  @ApiResponse({
    status: 501,
    description: 'Not implemented yet - catalogue endpoints are pending.',
  })
  status(): never {
    throw new NotImplementedException('Public API not implemented yet');
  }
}
