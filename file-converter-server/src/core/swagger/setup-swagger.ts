import { INestApplication, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const SWAGGER_PATH = 'docs';

export function setupSwagger(app: INestApplication, port: number): void {
  const config = new DocumentBuilder()
    .setTitle('File Converter API')
    .setDescription('HTTP API for the file converter backend.')
    .setVersion('0.0.1')
    .addCookieAuth(
      'access_token',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'access_token',
      },
      'access_token',
    )
    .addCookieAuth(
      'refresh_token',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'refresh_token',
      },
      'refresh_token',
    )
    .addTag(
      'RBAC / Roles',
      'Named role catalog (admin, user, …). Roles have no actions by themselves.',
    )
    .addTag(
      'RBAC / Permissions',
      'Resource catalog: unique name plus the actions that can be granted (read, create, …).',
    )
    .addTag(
      'RBAC / Grants',
      'Links a role to a permission with all actions or a subset. This is what a role is allowed to do.',
    )
    .addTag(
      'RBAC / User roles',
      'Assigns roles to a user. PUT replaces the full set. Users never hold permissions directly.',
    )
    .addTag(
      'Files',
      'Upload files to S3-compatible storage and list them. Admins see every file with publisher email; other users see only their own.',
    )
    .addTag(
      'Convert',
      'Authenticated file conversion. List allowed format pairs and submit a source file with a target format.',
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
