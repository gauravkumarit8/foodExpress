import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  async check() {
    const databaseUp = await this.pingDatabase();
    if (!databaseUp) {
      // A load balancer / orchestrator should stop routing traffic here —
      // "the process is running" and "the app actually works" aren't the
      // same thing, and the old health check only ever proved the former.
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'unreachable',
        timestamp: new Date().toISOString(),
      });
    }
    return { status: 'ok', database: 'connected', timestamp: new Date().toISOString() };
  }

  private async pingDatabase(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
