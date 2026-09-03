import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1788441149828 implements MigrationInterface {
    name = 'Migration1788441149828'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "otp" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "user_id" uuid NOT NULL, "otp_hash" character varying NOT NULL, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "attempts" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_32556d9d7b22031d7d0e1fd6723" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "otp"`);
    }

}
