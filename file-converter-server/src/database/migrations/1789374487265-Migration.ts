import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1789374487265 implements MigrationInterface {
    name = 'Migration1789374487265'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "role" character varying(16) NOT NULL DEFAULT 'user'`);
    }

}
