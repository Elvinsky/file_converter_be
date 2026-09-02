import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1788365740096 implements MigrationInterface {
    name = 'Migration1788365740096'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "is_active" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_active"`);
    }

}
