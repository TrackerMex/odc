import { Controller, Get } from '@nestjs/common';
import { Public } from './modules/auth/infrastructure/decorators/public.decorator';

@Public()
@Controller()
export class HealthController {
  @Get('health')
  check(): { status: string } {
    return { status: 'ok' };
  }
}
