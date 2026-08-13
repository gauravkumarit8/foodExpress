import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';

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
  configureApp(app);
  app.enableShutdownHooks(); // let the app drain in-flight requests on SIGTERM instead of dying mid-request

  // Gated to non-production — the API surface (including internal error
  // shapes) shouldn't be publicly browsable on a real deployment by default.
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('FoodExpress API')
      .setDescription('MVP backend for the FoodExpress food delivery app')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`FoodExpress backend running on http://localhost:${port}/api/v1`, 'Bootstrap');
  if (process.env.NODE_ENV !== 'production') {
    Logger.log(`API docs at http://localhost:${port}/api/docs`, 'Bootstrap');
  }
}
bootstrap();
