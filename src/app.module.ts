import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { UsersModule } from './modules/users/users.module';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { HealthController } from './common/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    // Global default: 100 requests/minute per IP. Auth endpoints override
    // this with a much tighter limit (see AuthController) since brute-forcing
    // login/register is the thing that actually needs stopping.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const sslEnabled = config.get<boolean>('database.ssl') ?? false;

        return {
          type: 'postgres' as const,
          ...(config.get<string>('database.url')
            ? { url: config.get<string>('database.url') }
            : {
                host: config.get<string>('database.host'),
                port: config.get<number>('database.port'),
                username: config.get<string>('database.username'),
                password: config.get<string>('database.password'),
                database: config.get<string>('database.name'),
              }),
          autoLoadEntities: true,
          ssl: sslEnabled ? { rejectUnauthorized: false } : false,
          // Dev-only auto-sync. Once schema stabilizes, switch to real
          // TypeORM migrations under src/database/migrations instead.
          synchronize: config.get<string>('nodeEnv') !== 'production',
        };
      },
    }),
    UsersModule,
    RestaurantsModule,
    OrdersModule,
    PaymentsModule,
    DeliveryModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
