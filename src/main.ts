import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

// A leaked or default JWT secret means anyone can forge a valid token for
// any user — this is the single most damaging config mistake possible here,
// so refuse to boot in production rather than silently run insecurely.
const INSECURE_JWT_SECRETS = new Set([
  'dev-secret-change-me',
  'change-this-secret-in-production',
  'ci-test-secret',
  'secret',
]);

function assertProductionSafety() {
  if (process.env.NODE_ENV !== 'production') return;

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || INSECURE_JWT_SECRETS.has(secret)) {
    throw new Error(
      'Refusing to start: JWT_SECRET is missing, too short, or a known default value. ' +
        'Set a unique, randomly-generated secret (32+ characters) before running in production.',
    );
  }
}

async function bootstrap() {
  assertProductionSafety();

  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  // CORS_ORIGIN is a comma-separated allowlist (e.g. "https://app.example.com").
  // Left unset, this defaults to allowing any origin — fine for local dev,
  // not fine for production. Set it once a frontend domain exists.
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
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.enableShutdownHooks(); // let the app drain in-flight requests on SIGTERM instead of dying mid-request

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`FoodExpress backend running on http://localhost:${port}/api/v1`, 'Bootstrap');
}
bootstrap();
