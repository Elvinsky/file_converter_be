# file_converter_be

- NestJS backend: [`file-converter-server`](./file-converter-server)

## Running everything with Docker Compose

The repo root has a `docker-compose.yml` that runs `postgres`, `adminer`, and `backend` (`file-converter-server`).

1. Copy the example env file and adjust values if needed:

   ```bash
   cp .env.example .env
   ```

2. Build and start the stack (recommended — auto-selects free host ports if the preferred ones are already taken):

   ```bash
   ./scripts/compose-up.sh
   ```

   Equivalent to `docker compose up --build`, but runs `scripts/allocate-ports.sh` first. If e.g. host `5432` is already bound, Postgres is published on the next free port and the mapping is written to `.env.docker.ports`.

   You can still pass any compose args through:

   ```bash
   ./scripts/compose-up.sh up --build -d
   ./scripts/compose-up.sh down -v
   ```

3. Once all containers report healthy (ports may differ if remapped — check the script output / `.env.docker.ports`):
   - Backend status check: `http://localhost:<PORT>/status` → `{"status":"ok"}`
   - Swagger UI: `http://localhost:<PORT>/docs` (JSON spec at `/docs-json`). Controlled by `SWAGGER_ENABLED` (default `true`)
   - Adminer: `http://localhost:<ADMINER_PORT>`
   - Postgres from the host: `localhost:<POSTGRES_HOST_PORT>` (inside Docker the DB remains on `postgres:5432`)

4. Tear everything down (and remove the Postgres volume) with:

   ```bash
   ./scripts/compose-up.sh down -v
   ```

The root `.env` (see `.env.example` for documented defaults) configures Postgres credentials and the backend port/secrets. Inside the Docker network the backend always connects to Postgres via the `postgres` service name.
