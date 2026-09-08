import { INestApplication, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const SWAGGER_PATH = 'docs';

export function setupSwagger(app: INestApplication, port: number): void {
  const config = new DocumentBuilder()
    .setTitle('File Converter API')
    .setDescription('HTTP API for the file converter backend.')
    .setVersion('0.0.1')
    .addCookieAuth(
      'refresh_token',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'refresh_token',
      },
      'refresh_token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      withCredentials: true,
    },
  });

  Logger.log(
    `Swagger UI available at http://localhost:${port}/${SWAGGER_PATH}`,
    'Swagger',
  );
}
