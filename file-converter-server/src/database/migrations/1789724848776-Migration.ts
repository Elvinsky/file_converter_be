import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1789724848776 implements MigrationInterface {
  name = 'Migration1789724848776';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "original_name" character varying NOT NULL, "storage_key" character varying NOT NULL, "content_type" character varying NOT NULL, "size_bytes" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_files" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_files_user_id" ON "files" ("user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ADD CONSTRAINT "FK_files_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT "FK_files_user_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_files_user_id"`);
    await queryRunner.query(`DROP TABLE "files"`);
  }
}
