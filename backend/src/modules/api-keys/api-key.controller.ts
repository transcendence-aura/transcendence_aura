import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { ApiKeyCreatedDto } from './dto/api-key-created.dto';

// Management endpoints for API keys, authenticated with the normal
// JWT-based RolesGuard - not with an API key itself, since creating the
// first key can't depend on already having one. Any authenticated user can
// manage their own keys (the public API they gate is catalogue-only/no
// personal data, so self-service issuance carries little risk) - ownership,
// not role, is what's enforced on revoke.
//
// Controller path is 'keys', not 'api-keys': nginx's `location /api/`
// only matches paths starting with /api/ (a literal slash after "api"),
// so this lives under that prefix - client-facing /api/keys - rather than
// as a sibling /api-keys path nginx would never route to the backend.
@ApiTags('API Keys')
@ApiBearerAuth('ApiKeyManagementAuth')
@Controller('keys')
@UseGuards(RolesGuard)
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  @ApiOperation({
    summary: 'Create an API key for the public API',
    description:
      'Self-service - creates a key owned by the caller. Only one active key per account: ' +
      'returns 409 if the caller already has a non-revoked key. The raw key is returned only ' +
      'in this response and can never be retrieved again.',
  })
  @ApiResponse({ status: 201, description: 'Key created.', type: ApiKeyCreatedDto })
  @ApiResponse({ status: 409, description: 'The caller already has an active key.' })
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateApiKeyDto,
  ): Promise<ApiKeyCreatedDto> {
    return this.apiKeyService.create(req.userId!, dto);
  }

  @Post(':id/revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Revoke an API key',
    description:
      'Allowed for the key owner, or for an ADMIN acting on any account. Idempotent - ' +
      'revoking an already-revoked key still returns 204.',
  })
  @ApiResponse({ status: 204, description: 'Revoked (or already revoked).' })
  @ApiResponse({ status: 403, description: 'Caller is neither the owner nor an ADMIN.' })
  @ApiResponse({ status: 404, description: 'No key with this id.' })
  revoke(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<void> {
    return this.apiKeyService.revoke(id, req.user!);
  }
}
