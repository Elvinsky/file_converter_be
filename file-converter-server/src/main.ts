import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import compression from '@fastify/compress';
import fastifyCookie from '@fastify/cookie';
import { ValidationPipe } from '@nestjs/common';
import {
  initializeTransactionalContext,
  StorageDriver,
} from 'typeorm-transactional';

import { AppModule } from './core/app/app.module';
import { ConfigService } from '@/core/config/config.service';
import { setupSwagger } from '@/core/swagger/setup-swagger';

async function bootstrap() {
  initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  const configService = app.get(ConfigService);
  const port = configService.get('PORT');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5174',
      'http://localhost:4200',
      'http://localhost:8080',
      `http://localhost:${port}`,
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  await app.register(fastifyCookie, {
    secret: configService.get('COOKIE_SECRET'),
  });

  if (configService.get('SWAGGER_ENABLED')) {
    setupSwagger(app, port);
  }

  // Register after Swagger so compressed responses do not break the UI assets.
  await app.register(compression);

  await app.listen(port, '0.0.0.0');
}

void bootstrap();
