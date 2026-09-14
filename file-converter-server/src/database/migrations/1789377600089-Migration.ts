import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1789377600089 implements MigrationInterface {
    name = 'Migration1789377600089'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rbac_roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_rbac_roles_name" UNIQUE ("name"), CONSTRAINT "PK_rbac_roles" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "role_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_user_roles_user_id_role_id" UNIQUE ("user_id", "role_id"), CONSTRAINT "PK_user_roles" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rbac_permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "actions" text array NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_rbac_permissions_name" UNIQUE ("name"), CONSTRAINT "PK_rbac_permissions" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rbac_grants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role_id" uuid NOT NULL, "permission_id" uuid NOT NULL, "actions" text array, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_rbac_grants_role_id_permission_id" UNIQUE ("role_id", "permission_id"), CONSTRAINT "PK_rbac_grants" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_user_roles_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_user_roles_role_id" FOREIGN KEY ("role_id") REFERENCES "rbac_roles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rbac_grants" ADD CONSTRAINT "FK_rbac_grants_role_id" FOREIGN KEY ("role_id") REFERENCES "rbac_roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rbac_grants" ADD CONSTRAINT "FK_rbac_grants_permission_id" FOREIGN KEY ("permission_id") REFERENCES "rbac_permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rbac_grants" DROP CONSTRAINT "FK_rbac_grants_permission_id"`);
        await queryRunner.query(`ALTER TABLE "rbac_grants" DROP CONSTRAINT "FK_rbac_grants_role_id"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_user_roles_role_id"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_user_roles_user_id"`);
        await queryRunner.query(`DROP TABLE "rbac_grants"`);
        await queryRunner.query(`DROP TABLE "rbac_permissions"`);
        await queryRunner.query(`DROP TABLE "user_roles"`);
        await queryRunner.query(`DROP TABLE "rbac_roles"`);
    }

}
