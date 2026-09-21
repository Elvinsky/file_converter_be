export interface Config {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';

  /**
   * Cookie secret
   */
  COOKIE_SECRET: string;

  /**
   * Health check options
   */
  HEALTH_CHECK_ENABLED?: boolean;

  /**
   * OpenAPI / Swagger UI at `/docs`
   */
  SWAGGER_ENABLED?: boolean;

  /**
   * Throttler options
   */
  THROTTLE_GLOBAL_TTL?: number;
  THROTTLE_GLOBAL_LIMIT?: number;

  /**
   * PostgreSQL database options
   */
  POSTGRES_HOST: string;
  POSTGRES_PORT: number;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_DB: string;
  POSTGRES_SYNCHRONIZE?: boolean;
  POSTGRES_LOGGING?: boolean;
  POSTGRES_MIGRATIONS_RUN?: boolean;

  /**
   * Redis options
   */
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;

  /**
   * OTP options
   */
  OTP_TTL_SECONDS: number;
  OTP_LENGTH: number;
  OTP_MAX_ATTEMPTS: number;

  /**
   * SMTP options
   */
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  SMTP_FROM: string;

  /**
   * JWT options
   */
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_TOKEN_EXPIRES_IN: string;

  /**
   * Seeded admin user (used by the initial admin migration)
   */
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;

  /**
   * S3-compatible object storage (MinIO locally, AWS S3 in production)
   */
  S3_ENDPOINT: string;
  S3_REGION: string;
  S3_ACCESS_KEY: string;
  S3_SECRET_KEY: string;
  S3_BUCKET: string;
  S3_FORCE_PATH_STYLE: boolean;

  MULTIPART_MAX_FILE_BYTES: number;

  CONVERT_MAX_UPLOAD_CSV_BYTES: number;
  CONVERT_MAX_UPLOAD_JSON_BYTES: number;
  CONVERT_MAX_UPLOAD_XML_BYTES: number;
  CONVERT_MAX_UPLOAD_YAML_BYTES: number;
  CONVERT_TIMEOUT_MS: number;
  CONVERT_MAX_DEPTH: number;
  CONVERT_MAX_KEYS: number;
  CONVERT_MAX_CSV_ROWS: number;
  CONVERT_YAML_MAX_ALIASES: number;
  CONVERT_WORKER_POOL_SIZE: number;
}
