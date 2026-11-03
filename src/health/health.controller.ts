import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator.js';

export interface HealthStatus {
  status: 'ok';
  uptimeSeconds: number;
}

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check(): HealthStatus {
    return { status: 'ok', uptimeSeconds: Math.round(process.uptime()) };
  }
}
