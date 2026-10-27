import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import compression from '@fastify/compress';
import fastifyCookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import { ValidationPipe } from '@nestjs/common';
import {
  initializeTransactionalContext,
  StorageDriver,
} from 'typeorm-transactional';

import { AppModule } from './core/app/app.module';
import { ConfigService } from '@/core/config/config.service';
import { API_GLOBAL_PREFIX } from '@/core/http/http.constants';
import { SWAGGER_PATH, setupSwagger } from '@/core/swagger/setup-swagger';

const API_CONTENT_SECURITY_POLICY =
  "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'";

const DOCS_CONTENT_SECURITY_POLICY =
  "default-src 'self'; base-uri 'self'; font-src 'self' data:; img-src 'self' data: https://validator.swagger.io; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'";

const STRICT_TRANSPORT_SECURITY = 'max-age=15552000; includeSubDomains';

async function bootstrap() {
  initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  const configService = app.get(ConfigService);
  const port = configService.get('PORT');

  app.setGlobalPrefix(API_GLOBAL_PREFIX);

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

  await app.register(multipart, {
    limits: {
      fileSize: configService.get('MULTIPART_MAX_FILE_BYTES'),
      files: 1,
    },
  });

  const swaggerEnabled = Boolean(configService.get('SWAGGER_ENABLED'));

  if (swaggerEnabled) {
    setupSwagger(app, port);
  }

  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    strictTransportSecurity: {
      maxAge: 15552000,
      includeSubDomains: true,
    },
    xContentTypeOptions: true,
  });

  const docsPrefix = `/${SWAGGER_PATH}`;

  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onRequest', async (request, reply) => {
      const path = request.url.split('?')[0] ?? '';
      const docs =
        swaggerEnabled &&
        (path === docsPrefix || path.startsWith(`${docsPrefix}/`));

      reply.header(
        'Content-Security-Policy',
        docs ? DOCS_CONTENT_SECURITY_POLICY : API_CONTENT_SECURITY_POLICY,
      );
      reply.header('X-Content-Type-Options', 'nosniff');
      reply.header('Strict-Transport-Security', STRICT_TRANSPORT_SECURITY);
    });

  // Register after Swagger so compressed responses do not break the UI assets.
  await app.register(compression);

  await app.listen(port, '0.0.0.0');
}

void bootstrap();
