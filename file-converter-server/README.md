# file-converter-server

NestJS backend for the file converter. HTTP kernel is **Fastify** (`@nestjs/platform-fastify`), not Express — use Fastify plugins and types (`NestFastifyApplication`, `app.register(...)`) in `src/main.ts`. Compression (`@fastify/compress`) and cookies (`@fastify/cookie`) are already registered.

HTTP routes use the global prefix `/api` (for example `GET /api/status`, `GET /api/convert/formats`). OpenAPI/Swagger UI is served at `/docs` (JSON spec at `/docs-json`) when `SWAGGER_ENABLED` is true (the default). Root `docker compose up` passes this through to the backend container.

## Scripts

```bash
npm run start:dev    # Development with hot reload
npm run start:prod   # Production
npm run build        # Build
npm run lint         # Lint & fix
npm run test         # Unit tests
npm run test:e2e     # E2E tests
```

## Project Structure

```
src/
├── core/
│   ├── config/      # App configuration (env variables)
│   ├── database/    # TypeORM + PostgreSQL connection
│   ├── health/      # Health check endpoints
│   └── app/         # Root module
├── database/        # TypeORM CLI data-source and migrations
├── modules/         # Feature modules
└── main.ts          # Entry point
```

## Database

PostgreSQL and TypeORM are already wired in. Use them for new modules — no extra setup.

- **Local Postgres:** `docker compose up -d` (image and credentials from `.env` / `.env.example`)
- **Connection:** `DatabaseModule` (`src/core/database`) is imported in `AppModule`
- **Entities:** any `*.entity.ts` under `src/` is auto-loaded
- **Repositories:** `TypeOrmModule.forFeature([YourEntity])` in a feature module, then `@InjectRepository(YourEntity)`
- **Transactions:** `@Transactional()` from `typeorm-transactional` (context is initialized in `main.ts`)
- **Schema:** migrations in `src/database/migrations/`. `POSTGRES_SYNCHRONIZE` is `false` by default — do not rely on auto-sync

```bash
npm run migration:generate   # Generate from entity changes
npm run migration:run        # Apply pending migrations
npm run migration:revert     # Roll back the last migration
npm run migration:show       # List applied / pending
```

CLI uses `src/database/data-source.ts`. At runtime, Nest uses the DataSource from `DatabaseModule`. If `POSTGRES_MIGRATIONS_RUN=true`, pending migrations also run on app start.

## Libraries

| Purpose       | Library                  |
|---------------|--------------------------|
| HTTP          | Fastify (`@nestjs/platform-fastify`) |
| OpenAPI       | Swagger (`@nestjs/swagger`) at `/docs` |
| Validation    | Joi                      |
| ORM           | TypeORM (`@nestjs/typeorm`) |
| Database      | PostgreSQL (`pg`)        |

## Core Modules

| Purpose       | Module           |
|---------------|-----------------|
| Configuration | `ConfigModule`  |
| Database      | `DatabaseModule` |
| Health Check  | `HealthModule`  |

## Adding a Module

```bash
nest generate module <name>
nest generate controller <name>
nest generate service <name>
```

## Conversion rules

Text conversion accepts CSV, JSON, XML, and YAML in every direction except a format to itself.

- CSV is a table with a header row. Each row becomes an object, and every cell stays text.
- When writing CSV, nested fields become dotted column names. A list of plain values becomes one column named `value`. An empty list or a single plain value cannot become CSV.
- XML attributes are kept as `@_name`. Text content is kept as `#text`. Output XML is wrapped in `<root>`. Lists become repeated `<item>` elements.
- Files must be UTF-8. A leading BOM is accepted and removed. Empty files are rejected.
- Each source format has its own upload size limit in application configuration.

Image conversion accepts only PNG to JPEG, JPEG to PNG, and SVG to PNG or JPEG. PNG and JPEG are never turned into SVG.

- JPEG output is opaque. Transparent pixels are placed on white, or on the SVG background color when that color was requested.
- PNG output from JPEG keeps the picture as a PNG. SVG rasterization uses the requested background (default `#ffffff`).
- SVG files that contain scripts or external resources are rejected.
- A picture that would expand beyond the configured pixel limit is rejected.
- Width and height limits for SVG output are set in application configuration, separately from the PNG, JPEG, and SVG upload size limits.

Every signed-in conversion, including failures, is stored in transformation history. File and image contents are not stored in that history and are not written to logs. `save=true` keeps the result in the existing MinIO bucket until the history retention period ends (default 90 days). If saving fails, the converted file is still returned and the history row has nothing to download. A user downloads only their own saved files. An administrator with permission `transformations-history` + `read` can list and download one user’s history.

## Code Style

- Use `@` aliases for imports (e.g., `@config/config.service`)
- Run `npm run format` before committing
- Follow NestJS module pattern
