import { Controller, Get, NotImplementedException } from '@nestjs/common';

// Every route answers 501 until the real endpoints are built.
@Controller('api')
export class ApiController {
  @Get('status')
  status(): never {
    throw new NotImplementedException('Public API not implemented yet');
  }
}
