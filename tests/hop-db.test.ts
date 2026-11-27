// Runs the HOP migration on a local copy of production (real Pujo backup) and
// checks old data is untouched and the new checkout behaves. No network.
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
// @ts-expect-error plain JS helper
import { mockDb, asStaff } from "../scripts/mock-db.mjs";

const BACKUP =
  process.env.BB_BACKUP ||
  "/Users/utkarshsingh/BBC/Backups/mochapot-backup-2026-11-27-pre-hop.json";
const hasBackup = existsSync(BACKUP);
let db: any;
const backup = hasBackup ? JSON.parse(readFileSync(BACKUP, "utf8")) : null;
const line = (item_id: number, option = "", quantity = 1) => ({
  item_id,
  option,
  quantity,
});
const order = (lines: object[], id = crypto.randomUUID(), event = "hop") =>
  asStaff(
    db,
    "select public.create_event_order($1,$2,$3::jsonb,'UPI','') as id",
    [event, id, JSON.stringify(lines)],
  ).then((r: any) => Number(r.rows[0].id));

beforeAll(async () => {
  ({ db } = await mockDb({ backup: hasBackup ? BACKUP : undefined }));
}, 120000);
afterAll(async () => db?.close());

describe.runIf(hasBackup)("old Pujo data after migration", () => {
  it("keeps every order, line, event and total exactly", async () => {
    const live = backup.orders.filter((o: any) => o.status !== "Cancelled");
    const r = (
      await db.query(`select
        (select count(*)::int from orders) orders,
        (select count(*)::int from orders where status<>'Cancelled') live,
        (select sum(total_paise)::int from orders where status<>'Cancelled') paise,
        (select count(*)::int from order_items) items,
        (select count(*)::int from order_events) events,
        (select count(*)::int from orders where event<>'pujo' or ticket_no is not null) retagged`)
    ).rows[0];
    expect(r).toEqual({
      orders: backup.orders.length,
      live: live.length,
      paise: live.reduce((n: number, o: any) => n + o.total_paise, 0),
      items: backup.order_items.length,
      events: backup.order_events.length,
      retagged: 0,
    });
    expect(r.paise).toBe(33103500);
  });
  it("keeps the Pujo menu rows unchanged and tagged pujo", async () => {
    const rows = (
      await db.query(
        "select id,name,price_paise,available from menu_items where event='pujo' order by id",
      )
    ).rows;
    expect(rows).toEqual(
      backup.menu_items
        .map((m: any) => ({
          id: m.id,
          name: m.name,
          price_paise: m.price_paise,
          available: m.available,
        }))
        .sort((a: any, b: any) => a.id - b.id),
    );
  });
  it("still accepts an old-style Pujo order and tags it pujo", async () => {
    const id = (
      await asStaff(
        db,
        `select public.create_order($1,'[{"item_id":0,"option":"Hot","quantity":1,"addon":"None"}]'::jsonb,'Cash','TEST') id`,
        [crypto.randomUUID()],
      )
    ).rows[0].id;
    const o = (
      await db.query("select event,ticket_no from orders where id=$1", [id])
    ).rows[0];
    expect(o).toEqual({ event: "pujo", ticket_no: null });
  });
});

describe("HOP checkout", () => {
  it("has the full HOP menu", async () => {
    const r = (
      await db.query(
        "select category,count(*)::int n from menu_items where event='hop' group by 1 order by 1",
      )
    ).rows;
    expect(Object.fromEntries(r.map((x: any) => [x.category, x.n]))).toEqual({
      "Add-ons": 7,
      Matcha: 5,
      Mocktails: 6,
      "Non-coffee": 4,
      Seasonal: 6,
      Signature: 5,
      Standard: 5,
    });
  });
  it("prices from the server and keeps tap order with add-ons after their drink", async () => {
    const id = await order([
      line(101, "Iced"), // OG Cold Coffee 249
      line(160), // Hazelnut 40
      line(114, "Hot"), // Spanish Latte 329
      line(164), // Vanilla 40
      line(160), // Hazelnut again, separate line
      line(110, "Diet Coke", 2), // Fridge Cigarette 2 x 329
    ]);
    const o = (
      await db.query(
        "select event,ticket_no,total_paise from orders where id=$1",
        [id],
      )
    ).rows[0];
    expect(o.event).toBe("hop");
    expect(o.total_paise).toBe((249 + 40 + 329 + 40 + 40 + 658) * 100);
    const names = (
      await db.query(
        "select name from order_items where order_id=$1 order by id",
        [id],
      )
    ).rows.map((x: any) => x.name);
    expect(names).toEqual([
      "OG Cold Coffee",
      "Hazelnut",
      "Spanish Latte",
      "Vanilla",
      "Hazelnut",
      "Fridge Cigarette",
    ]);
  });
  it("numbers HOP tickets 1, 2, 3 independently of old order IDs", async () => {
    const nums = [];
    for (let i = 0; i < 3; i++) {
      const id = await order([line(100, "Hot")]);
      nums.push(
        (await db.query("select ticket_no from orders where id=$1", [id]))
          .rows[0].ticket_no,
      );
    }
    expect(nums[1]).toBe(nums[0] + 1);
    expect(nums[2]).toBe(nums[1] + 1);
    const first = (
      await db.query("select min(ticket_no) m from orders where event='hop'")
    ).rows[0].m;
    expect(first).toBe(1);
  });
  it("retrying the same request returns the same order; changed details are rejected", async () => {
    const rid = crypto.randomUUID();
    const a = await order([line(150, "Iced")], rid);
    const b = await order([line(150, "Iced")], rid);
    expect(b).toBe(a);
    await expect(order([line(151, "Iced")], rid)).rejects.toThrow(
      /different details/,
    );
    const n = (
      await db.query("select count(*)::int n from orders where request_id=$1", [
        rid,
      ])
    ).rows[0].n;
    expect(n).toBe(1);
  });
  it("rejects wrong items/options and saves nothing (no ticket number used)", async () => {
    const before = (
      await db.query(
        "select count(*)::int n, max(ticket_no) t from orders where event='hop'",
      )
    ).rows[0];
    await expect(order([line(100, "Hot"), line(0, "Hot")])).rejects.toThrow(
      /unavailable/,
    ); // Pujo item
    await expect(order([line(101, "Hot")])).rejects.toThrow(/serving option/); // OG is iced only
    await expect(order([line(130, "Iced")])).rejects.toThrow(/serving option/); // hot chocolate
    await expect(
      order([{ item_id: 102, option: "Hot", quantity: 1, addon: "Hazelnut" }]),
    ).rejects.toThrow(/separate lines/);
    await expect(order([line(100, "Hot")], undefined, "pujo")).rejects.toThrow(
      /Unknown event/,
    );
    await expect(order([line(100, "Hot", 0)])).rejects.toThrow(/Quantity/);
    const after = (
      await db.query(
        "select count(*)::int n, max(ticket_no) t from orders where event='hop'",
      )
    ).rows[0];
    expect(after).toEqual(before);
  });
  it("refuses people who are not approved staff", async () => {
    await db.query(
      "insert into auth.users values('00000000-0000-0000-0000-000000000009','stranger@example.invalid',now())",
    );
    await expect(
      asStaff(
        db,
        "select public.create_event_order('hop',$1,'[{\"item_id\":100,\"option\":\"Hot\",\"quantity\":1}]'::jsonb,'UPI','')",
        [crypto.randomUUID()],
        "00000000-0000-0000-0000-000000000009",
      ),
    ).rejects.toThrow(/Staff access/);
  });
  it("moves New → Brewing → Done, cancels and restores with version checks", async () => {
    const id = await order([line(140, "Iced")]);
    const mv = (v: number, s: string) =>
      asStaff(
        db,
        "select (public.move_order($1,$2,$3,$4)).*",
        [id, v, s, crypto.randomUUID()],
      ).then((r: any) => r.rows[0]);
    expect((await mv(1, "Preparing")).status).toBe("Preparing");
    expect((await mv(2, "Collected")).status).toBe("Collected");
    await expect(mv(2, "Queued")).rejects.toThrow(/another device/);
    const c = (
      await asStaff(db, "select (public.cancel_order($1,3,'test',$2)).*", [
        id,
        crypto.randomUUID(),
      ])
    ).rows[0];
    expect(c.status).toBe("Cancelled");
    expect((await mv(4, "Queued")).status).toBe("Queued");
  });
});
