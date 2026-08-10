import { INestApplication, ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

/**
 * Every global pipe/filter/interceptor the app relies on, in one place.
 * Both main.ts (real server) and test/app.e2e-spec.ts (test server) call
 * this — so a config-only bug like "forgot to wire up an interceptor" is
 * impossible to have silently drift between what runs in production and
 * what the e2e suite actually exercises. That drift is exactly what let a
 * password-hash leak fix look "fixed" (unit-wise) while the real HTTP path
 * — which the e2e suite is supposed to guard — never actually applied it.
 */
export function configureApp(app: INestApplication): void {
  app.use(helmet());

  const corsOrigin = process.env.CORS_ORIGIN;
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(',').map((o) => o.trim()) : true,
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );
}
