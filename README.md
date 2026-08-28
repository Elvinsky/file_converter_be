# file_converter_be

- Next.js app: [`file-converter-app`](./file-converter-app)
- NestJS backend: [`file-converter-server`](./file-converter-server)

## Running everything with Docker Compose

The repo root has a `docker-compose.yml` that runs all three services together: `postgres`, `backend` (`file-converter-server`) and `frontend` (`file-converter-app`).

1. Copy the example env file and adjust values if needed:

   ```bash
   cp .env.example .env
   ```

2. Build and start the stack:

   ```bash
   docker compose up --build
   ```

3. Once all containers report healthy:
   - Backend status check: `http://localhost:3007/status` → `{"status":"ok"}`
   - Frontend: `http://localhost:3000` → shows "App is running" and, once the backend is reachable, "server is running"

4. Tear everything down (and remove the Postgres volume) with:

   ```bash
   docker compose down -v
   ```

The root `.env` (see `.env.example` for documented defaults) configures Postgres credentials, the backend port/secrets, and the frontend port. Inside the Docker network the backend always connects to Postgres via the `postgres` service name, and the frontend talks to the backend via `http://backend:<PORT>` — no manual host wiring required.
