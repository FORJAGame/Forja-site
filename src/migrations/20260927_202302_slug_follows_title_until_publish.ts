import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guilds" ADD COLUMN "generate_slug" boolean DEFAULT true;
  ALTER TABLE "_guilds_v" ADD COLUMN "version_generate_slug" boolean DEFAULT true;
  ALTER TABLE "games" ADD COLUMN "generate_slug" boolean DEFAULT true;
  ALTER TABLE "_games_v" ADD COLUMN "version_generate_slug" boolean DEFAULT true;`)

  // Existing documents already have their URL; only new documents follow the title.
  await db.execute(sql`
   UPDATE "guilds" SET "generate_slug" = false;
  UPDATE "_guilds_v" SET "version_generate_slug" = false;
  UPDATE "games" SET "generate_slug" = false;
  UPDATE "_games_v" SET "version_generate_slug" = false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guilds" DROP COLUMN "generate_slug";
  ALTER TABLE "_guilds_v" DROP COLUMN "version_generate_slug";
  ALTER TABLE "games" DROP COLUMN "generate_slug";
  ALTER TABLE "_games_v" DROP COLUMN "version_generate_slug";`)
}
