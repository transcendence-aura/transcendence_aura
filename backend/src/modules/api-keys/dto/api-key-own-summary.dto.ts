import { OmitType } from '@nestjs/swagger';
import { ApiKeySummaryDto } from './api-key-summary.dto';

// What a user sees of their own keys: the admin summary without the owner (it is the caller).
export class ApiKeyOwnSummaryDto extends OmitType(ApiKeySummaryDto, ['owner'] as const) {}
