import { MigrationInterface, QueryRunner } from 'typeorm';

const remapActions = `
  ARRAY(
    SELECT CASE action
      WHEN 'get' THEN 'read'
      WHEN 'post' THEN 'create'
      WHEN 'put' THEN 'update'
      ELSE action
    END
    FROM unnest(actions) AS action
  )
`;

export class Migration1789378601000 implements MigrationInterface {
  name = 'Migration1789378601000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "rbac_permissions"
      SET "actions" = ${remapActions}
      WHERE "actions" && ARRAY['get', 'post', 'put']::text[]
    `);

    await queryRunner.query(`
      UPDATE "rbac_grants"
      SET "actions" = ${remapActions}
      WHERE "actions" IS NOT NULL
        AND "actions" && ARRAY['get', 'post', 'put']::text[]
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "rbac_permissions"
      SET "actions" = ARRAY(
        SELECT CASE action
          WHEN 'read' THEN 'get'
          WHEN 'create' THEN 'post'
          WHEN 'update' THEN 'put'
          ELSE action
        END
        FROM unnest(actions) AS action
      )
      WHERE "actions" && ARRAY['read', 'create', 'update']::text[]
    `);

    await queryRunner.query(`
      UPDATE "rbac_grants"
      SET "actions" = ARRAY(
        SELECT CASE action
          WHEN 'read' THEN 'get'
          WHEN 'create' THEN 'post'
          WHEN 'update' THEN 'put'
          ELSE action
        END
        FROM unnest(actions) AS action
      )
      WHERE "actions" IS NOT NULL
        AND "actions" && ARRAY['read', 'create', 'update']::text[]
    `);
  }
}
