import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1789800000000 implements MigrationInterface {
  name = 'Migration1789800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "transformation_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "type" character varying NOT NULL,
        "source_format" character varying NOT NULL,
        "target_format" character varying NOT NULL,
        "status" character varying NOT NULL,
        "file_size" integer NOT NULL,
        "duration_ms" integer NOT NULL,
        "error_code" character varying,
        "storage_key" character varying,
        "result_file_name" character varying,
        "content_type" character varying,
        "expires_at" TIMESTAMP(3) NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transformation_history" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_transformation_history_user_id" ON "transformation_history" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transformation_history_created_at" ON "transformation_history" ("created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transformation_history_type" ON "transformation_history" ("type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transformation_history_status" ON "transformation_history" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transformation_history_user_created" ON "transformation_history" ("user_id", "created_at" DESC, "id" DESC)`,
    );
    await queryRunner.query(`
      ALTER TABLE "transformation_history"
      ADD CONSTRAINT "FK_transformation_history_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      CREATE TABLE "transformation_audits" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "actor_user_id" uuid NOT NULL,
        "target_user_id" uuid,
        "action" character varying NOT NULL,
        "transformation_id" uuid,
        "file_id" character varying,
        "result" character varying NOT NULL,
        "file_size" integer,
        "duration_ms" integer,
        "detail" text,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transformation_audits" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      INSERT INTO "rbac_permissions" ("name", "actions")
      SELECT 'transformations-history', ARRAY['read']::text[]
      WHERE NOT EXISTS (
        SELECT 1 FROM "rbac_permissions" WHERE "name" = 'transformations-history'
      )
    `);
    await queryRunner.query(`
      INSERT INTO "rbac_grants" ("role_id", "permission_id", "actions")
      SELECT r.id, p.id, ARRAY['read']::text[]
      FROM "rbac_roles" r
      CROSS JOIN "rbac_permissions" p
      WHERE r.name = 'admin' AND p.name = 'transformations-history'
        AND NOT EXISTS (
          SELECT 1 FROM "rbac_grants" g
          WHERE g.role_id = r.id AND g.permission_id = p.id
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "rbac_grants"
      WHERE "permission_id" IN (
        SELECT id FROM "rbac_permissions" WHERE name = 'transformations-history'
      )
    `);
    await queryRunner.query(`
      DELETE FROM "rbac_permissions" WHERE name = 'transformations-history'
    `);
    await queryRunner.query(`DROP TABLE "transformation_audits"`);
    await queryRunner.query(
      `ALTER TABLE "transformation_history" DROP CONSTRAINT "FK_transformation_history_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_transformation_history_user_created"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_transformation_history_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_transformation_history_type"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_transformation_history_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_transformation_history_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "transformation_history"`);
  }
}
