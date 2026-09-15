import { MigrationInterface, QueryRunner } from 'typeorm';

const ADMIN_USER_ID = 'b58b9594-f850-4e06-b5d1-5a75e3989089';

export class Migration1789378600000 implements MigrationInterface {
  name = 'Migration1789378600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "rbac_permissions" ("name", "actions")
      VALUES
        ('email', ARRAY['create']::text[]),
        ('users', ARRAY['read', 'update', 'delete']::text[]),
        ('files-list', ARRAY['read', 'create', 'update', 'delete']::text[]),
        ('my-files', ARRAY['read', 'create', 'update', 'delete']::text[]),
        ('me', ARRAY['read', 'update']::text[]),
        ('permissions', ARRAY['read', 'create', 'update', 'delete']::text[])
    `);

    await queryRunner.query(`
      INSERT INTO "rbac_roles" ("name", "description")
      VALUES
        ('user', 'Default end-user: own profile and own files'),
        ('admin', 'Full access to every resource')
    `);

    await queryRunner.query(`
      INSERT INTO "rbac_grants" ("role_id", "permission_id", "actions")
      SELECT r.id, p.id, ARRAY['read', 'update']::text[]
      FROM "rbac_roles" r
      CROSS JOIN "rbac_permissions" p
      WHERE r.name = 'user' AND p.name = 'me'
    `);

    await queryRunner.query(`
      INSERT INTO "rbac_grants" ("role_id", "permission_id", "actions")
      SELECT r.id, p.id, NULL
      FROM "rbac_roles" r
      CROSS JOIN "rbac_permissions" p
      WHERE r.name = 'user' AND p.name = 'my-files'
    `);

    await queryRunner.query(`
      INSERT INTO "rbac_grants" ("role_id", "permission_id", "actions")
      SELECT r.id, p.id, NULL
      FROM "rbac_roles" r
      CROSS JOIN "rbac_permissions" p
      WHERE r.name = 'admin'
    `);

    await queryRunner.query(`
      INSERT INTO "user_roles" ("user_id", "role_id")
      SELECT u.id, r.id
      FROM "users" u
      CROSS JOIN "rbac_roles" r
      WHERE r.name = 'user'
    `);

    await queryRunner.query(`
      INSERT INTO "user_roles" ("user_id", "role_id")
      SELECT '${ADMIN_USER_ID}'::uuid, r.id
      FROM "rbac_roles" r
      WHERE r.name = 'admin'
        AND EXISTS (SELECT 1 FROM "users" WHERE id = '${ADMIN_USER_ID}'::uuid)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "user_roles"
      WHERE "role_id" IN (
        SELECT id FROM "rbac_roles" WHERE name IN ('user', 'admin')
      )
    `);
    await queryRunner.query(`
      DELETE FROM "rbac_grants"
      WHERE "role_id" IN (
        SELECT id FROM "rbac_roles" WHERE name IN ('user', 'admin')
      )
    `);
    await queryRunner.query(
      `DELETE FROM "rbac_roles" WHERE name IN ('user', 'admin')`,
    );
    await queryRunner.query(`
      DELETE FROM "rbac_permissions"
      WHERE name IN ('email', 'users', 'files-list', 'my-files', 'me', 'permissions')
    `);
  }
}
