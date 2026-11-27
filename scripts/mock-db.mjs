// Local-only copy of the production schema in embedded PostgreSQL (PGlite).
// Optionally loads a JSON backup of real Pujo data, then applies migrations.
// Never connects to production.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";

export const TEST_USER = "00000000-0000-0000-0000-000000000001";
const dir = new URL("../supabase/migrations/", import.meta.url);
const migrations = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

// `stopBefore`: apply migrations up to (not including) this name, so the backup
// is loaded into the same schema production had when it was taken.
export async function mockDb({ backup, stopBefore = "20261127" } = {}) {
  const db = new PGlite();
  await db.exec(
    `create role anon; create role authenticated; create schema auth;
     create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
     create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
     grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`,
  );
  const apply = async (f) =>
    db.exec(readFileSync(new URL(f, dir), "utf8"));
  const before = migrations.filter((f) => f < stopBefore),
    after = migrations.filter((f) => f >= stopBefore);
  for (const f of before) await apply(f);
  if (backup) {
    const b = JSON.parse(readFileSync(backup, "utf8"));
    const users = new Set([
      ...b.orders.map((o) => o.created_by),
      ...b.order_events.map((e) => e.actor_id),
    ]);
    for (const u of users)
      await db.query("insert into auth.users values($1,null,now())", [u]);
    // Replace seeded menu/addons with the exact production rows.
    await db.exec("delete from public.menu_items; delete from public.addons;");
    const load = (table, rows) =>
      db.query(
        `insert into public.${table} ${table === "orders" || table === "order_items" ? "overriding system value" : ""}
         select * from jsonb_populate_recordset(null::public.${table}, $1::jsonb)`,
        [JSON.stringify(rows)],
      );
    await load("menu_items", b.menu_items);
    await load("addons", b.addons);
    await load("orders", b.orders);
    await load("order_items", b.order_items);
    await load("order_events", b.order_events);
    await db.exec(
      `select setval(pg_get_serial_sequence('public.orders','id'),(select max(id) from public.orders));
       select setval(pg_get_serial_sequence('public.order_items','id'),(select max(id) from public.order_items));`,
    );
  }
  for (const f of after) await apply(f);
  await db.exec(
    `insert into private.staff_emails values('test@example.invalid');
     insert into auth.users values('${TEST_USER}','test@example.invalid',now());`,
  );
  return { db, migrations: { before, after } };
}

// Run a statement as the signed-in test staff member.
export async function asStaff(db, sql, params = [], user = TEST_USER) {
  return db.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claim.sub',$1,true)`, [
      user,
    ]);
    await tx.exec("set local role authenticated");
    return tx.query(sql, params);
  });
}
