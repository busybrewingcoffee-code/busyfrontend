// Local Supabase-shaped API over the mock database (real Pujo backup + HOP
// migration). For localhost previews only; never talks to production.
//   node scripts/mock-api.mjs            → http://127.0.0.1:54330
//   POST /__mock/offline {"on":true}     → simulate the internet dropping
import http from "node:http";
import { existsSync } from "node:fs";
import { mockDb, asStaff, TEST_USER } from "./mock-db.mjs";

const PORT = Number(process.env.MOCK_PORT || 54330);
const BACKUP =
  process.env.BB_BACKUP ||
  "/Users/utkarshsingh/BBC/Backups/mochapot-backup-2026-11-27-pre-hop.json";
const { db } = await mockDb({
  backup: existsSync(BACKUP) ? BACKUP : undefined,
});
let offline = false;
const delay = Number(process.env.MOCK_DELAY_MS || 120);

const user = {
  id: TEST_USER,
  aud: "authenticated",
  role: "authenticated",
  email: "test@example.invalid",
  app_metadata: { provider: "email" },
  user_metadata: {},
  created_at: new Date().toISOString(),
};
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const session = () => {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return {
    access_token: `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: TEST_USER, exp, role: "authenticated" })}.mock`,
    refresh_token: "mock",
    expires_in: 3600,
    expires_at: exp,
    token_type: "bearer",
    user,
  };
};
const RPC = {
  create_event_order: ["p_event", "p_request_id", "p_lines", "p_payment", "p_note"],
  create_order: ["p_request_id", "p_lines", "p_payment", "p_note"],
  move_order: ["p_order_id", "p_expected_version", "p_status", "p_mutation_id"],
  cancel_order: ["p_order_id", "p_expected_version", "p_reason", "p_mutation_id"],
};
const TABLES = ["menu_items", "orders", "staff_members", "addons"];
const OPS = { eq: "=", lte: "<=", gte: ">=", lt: "<", gt: ">", neq: "<>" };

async function select(table, params) {
  const where = [],
    vals = [];
  for (const [k, v] of params) {
    if (["select", "order", "offset", "limit"].includes(k)) continue;
    const [op, ...rest] = v.split(".");
    if (!/^[a-z_]+$/.test(k) || !OPS[op]) throw Error(`Unsupported filter ${k}`);
    vals.push(rest.join("."));
    where.push(`t.${k} ${OPS[op]} $${vals.length}`);
  }
  let order = "";
  const o = params.get("order");
  if (o) {
    const [col, dir] = o.split(".");
    if (!/^[a-z_]+$/.test(col)) throw Error("bad order");
    order = `order by t.${col} ${dir === "desc" ? "desc" : "asc"}`;
  }
  const embed = (params.get("select") || "").includes("order_items")
    ? `, coalesce((select jsonb_agg(i order by i.id) from public.order_items i where i.order_id=t.id),'[]'::jsonb) order_items`
    : "";
  const limit = params.get("limit") ? `limit ${Number(params.get("limit"))}` : "";
  const offset = params.get("offset") ? `offset ${Number(params.get("offset"))}` : "";
  const sql = `select t.*${embed} from public.${table} t ${where.length ? "where " + where.join(" and ") : ""} ${order} ${limit} ${offset}`;
  return (await db.query(sql, vals)).rows;
}

http
  .createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
    res.setHeader("Access-Control-Expose-Headers", "*");
    res.setHeader("Content-Type", "application/json");
    if (req.method === "OPTIONS") return res.end("{}");
    const url = new URL(req.url, "http://localhost");
    let body = "";
    for await (const part of req) body += part;
    const data = body ? JSON.parse(body) : {};
    if (url.pathname === "/__mock/offline") {
      offline = !!data.on;
      return res.end(JSON.stringify({ offline }));
    }
    if (url.pathname === "/__mock/seed") {
      // Sample HOP orders either side of midnight IST, to check day filters.
      const menu = (await db.query("select id,options from menu_items where event='hop' and category<>'Add-ons'")).rows;
      const addons = (await db.query("select id from menu_items where event='hop' and category='Add-ons'")).rows;
      const base = Date.parse(data.from || "2026-11-26T22:30:00+05:30");
      for (let i = 0; i < (data.count || 40); i++) {
        const lines = Array.from({ length: 1 + (i % 3 === 0 ? 1 : 0) }, (_, j) => {
          const m = menu[(i * 7 + j * 3) % menu.length];
          return { item_id: m.id, option: m.options[(i + j) % m.options.length], quantity: 1 };
        });
        if (i % 4 === 0) lines.splice(1, 0, { item_id: addons[i % addons.length].id, option: "", quantity: 1 });
        const r = await asStaff(db, "select public.create_event_order('hop',$1,$2::jsonb,$3,'') id", [crypto.randomUUID(), JSON.stringify(lines), i % 5 ? "UPI" : "Cash"]);
        const at = new Date(base + i * 4.5 * 60000).toISOString();
        await db.query("update orders set created_at=$2, status='Collected' where id=$1", [r.rows[0].id, at]);
      }
      return res.end(JSON.stringify({ ok: true }));
    }
    if (url.pathname === "/__mock/stats") {
      const r = await db.query(
        `select event, count(*)::int orders, coalesce(sum(total_paise) filter (where status<>'Cancelled'),0)::int/100 sales from orders group by 1 order by 1`,
      );
      return res.end(JSON.stringify(r.rows));
    }
    if (delay) await new Promise((r) => setTimeout(r, delay));
    if (offline) {
      res.statusCode = 503;
      return res.end(JSON.stringify({ message: "Simulated offline network" }));
    }
    try {
      if (url.pathname.startsWith("/auth/v1/token")) return res.end(JSON.stringify(session()));
      if (url.pathname === "/auth/v1/user") return res.end(JSON.stringify(user));
      if (url.pathname === "/auth/v1/logout") return res.end("{}");
      const path = url.pathname.replace("/rest/v1/", "");
      let result;
      if (path.startsWith("rpc/")) {
        const name = path.slice(4);
        const keys = RPC[name];
        if (!keys) throw Error("RPC not allowed");
        const vals = keys.map((k) => (k === "p_lines" ? JSON.stringify(data[k]) : data[k]));
        const call = `public.${name}(${keys.map((_, i) => `$${i + 1}`).join(",")})`;
        const r = await asStaff(
          db,
          name.startsWith("create") ? `select ${call} as id` : `select (${call}).*`,
          vals,
        );
        result = name.startsWith("create") ? r.rows[0].id : r.rows[0];
      } else if (TABLES.includes(path)) {
        result = await select(path, url.searchParams);
        if ((req.headers.accept || "").includes("vnd.pgrst.object")) result = result[0] ?? null;
      } else {
        res.statusCode = 404;
        return res.end("{}");
      }
      res.end(JSON.stringify(result));
    } catch (e) {
      res.statusCode = 400;
      res.end(JSON.stringify({ message: e.message, code: e.code ?? "P0001" }));
    }
  })
  .listen(PORT, "127.0.0.1", () =>
    console.log(`MOCK API http://127.0.0.1:${PORT} (local copy, no production connection)`),
  );
