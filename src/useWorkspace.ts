import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import type { Item } from "./menu";
export type Line = {
  key: string;
  item: Item;
  qty: number;
  option: string;
  syrup: string;
  addonPrice?: number;
};
export type Status = "Queued" | "Preparing" | "Ready" | "Collected";
export type Order = {
  id: number;
  version: number;
  lines: Line[];
  payment: "UPI" | "Cash";
  status: Status;
  created: number;
  note: string;
};
type Pending = {
  id: string;
  lines: Line[];
  payment: "UPI" | "Cash";
  note: string;
};
const db = supabase!;
const message = (e: unknown) =>
  e && typeof e === "object" && "message" in e
    ? String(e.message)
    : "Connection lost. Please retry.";
export function useWorkspace(userId: string) {
  const [addonPrices, setAddonPrices] = useState<Record<string, number>>({
      None: 0,
    }),
    [menu, setMenu] = useState<Item[]>([]),
    [orders, setOrders] = useState<Order[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState<Set<number>>(new Set()),
    [submitting, setSubmitting] = useState(false),
    [pending, setPending] = useState<Pending | null>(() => {
      try {
        return JSON.parse(
          localStorage.getItem("bb-pending-" + userId) || "null",
        );
      } catch {
        return null;
      }
    });
  const pendingRef = useRef(pending),
    busy = useRef(false),
    locks = useRef(new Set<number>()),
    epoch = useRef(0),
    alive = useRef(true),
    lastSync = useRef(0);
  const [synced, setSynced] = useState(false);
  const refreshing = useRef(false);
  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    const n = ++epoch.current;
    try {
      const loadOrders = async () => {
        const page = (start: number, ceiling?: number) => {
          let q = db
            .from("orders")
            .select("id,version,payment,status,created_at,note,order_items(*)")
            .order("id", { ascending: false })
            .range(start, start + 499);
          if (ceiling !== undefined) q = q.lte("id", ceiling);
          return q;
        };
        const first = await page(0);
        if (first.error) throw first.error;
        const rows = [...first.data];
        const ceiling = rows[0]?.id;
        for (let start = 500; rows.length === start; start += 500) {
          const next = await page(start, ceiling);
          if (next.error) throw next.error;
          rows.push(...next.data);
        }
        return rows;
      };
      const [m, orderRows, a] = await Promise.all([
        db
          .from("menu_items")
          .select("*")
          .eq("available", true)
          .order("sort_order"),
        loadOrders(),
        db.from("addons").select("*"),
      ]);
      if (m.error) throw m.error;
      if (a.error) throw a.error;
      if (!alive.current || n !== epoch.current) return;
      const catalog: Item[] = m.data.map((x) => ({
        id: x.id,
        name: x.name,
        category: x.category,
        description: x.description,
        art: x.art,
        price: x.price_paise / 100,
        syrup: x.syrup,
        options: x.options.length > 1 ? x.options : undefined,
      }));
      setMenu(catalog);
      setAddonPrices(
        Object.fromEntries(a.data.map((a) => [a.name, a.price_paise / 100])),
      );
      const list: Order[] = orderRows.map((x) => ({
        id: x.id,
        version: x.version,
        payment: x.payment,
        status: x.status,
        created: Date.parse(x.created_at),
        note: x.note,
        lines: x.order_items.map((l) => ({
          key: String(l.id),
          item: {
            ...(catalog.find((m) => m.id === l.menu_item_id) ?? {
              id: l.menu_item_id,
              art: "cup",
              category: "",
              description: "",
            }),
            name: l.name,
            price: l.unit_price_paise / 100,
          },
          qty: l.quantity,
          option: l.option,
          syrup: l.addon,
          addonPrice: l.addon_price_paise / 100,
        })),
      }));
      setOrders((prev) =>
        list.map((o) =>
          locks.current.has(o.id) ||
          (prev.find((p) => p.id === o.id)?.version ?? 0) > o.version
            ? (prev.find((p) => p.id === o.id) ?? o)
            : o,
        ),
      );
      lastSync.current = Date.now();
      setSynced(true);
      setLoading(false);
    } catch (e) {
      if (alive.current && n === epoch.current) {
        setSynced(false);
        setError(message(e));
        setLoading(false);
      }
    } finally {
      refreshing.current = false;
    }
  }, []);
  useEffect(() => {
    alive.current = true;
    void refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 5000);
    const sync = () => void refresh();
    const offline = () => setSynced(false);
    window.addEventListener("online", sync);
    window.addEventListener("offline", offline);
    document.addEventListener("visibilitychange", sync);
    return () => {
      alive.current = false;
      epoch.current++;
      clearInterval(timer);
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", offline);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [refresh]);
  async function move(id: number, status: Status, expectedVersion?: number) {
    const order = orders.find((o) => o.id === id);
    if (!order || order.status === status || locks.current.has(id))
      return false;
    if (!navigator.onLine) {
      setError("You’re offline. Reconnect before moving an order.");
      return false;
    }
    epoch.current++;
    locks.current.add(id);
    setSaving(new Set(locks.current));
    setError("");
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      const { data, error } = await db.rpc("move_order", {
        p_order_id: id,
        p_expected_version: expectedVersion ?? order.version,
        p_status: status,
        p_mutation_id: crypto.randomUUID(),
      });
      if (error) throw error;
      setOrders((os) =>
        os.map((o) =>
          o.id === id
            ? { ...o, status: data.status, version: data.version }
            : o,
        ),
      );
      return true;
    } catch (e) {
      setOrders((os) => os.map((o) => (o.id === id ? order : o)));
      setError(message(e));
      return false;
    } finally {
      locks.current.delete(id);
      setSaving(new Set(locks.current));
      await refresh();
    }
  }
  async function checkout(
    lines: Line[],
    payment: "UPI" | "Cash",
    note: string,
  ) {
    if (busy.current) return null;
    if (!navigator.onLine) {
      setError(
        "You’re offline. Your order is still here; reconnect to save it.",
      );
      return null;
    }
    busy.current = true;
    setSubmitting(true);
    setError("");
    try {
      const request = pendingRef.current ?? {
        id: crypto.randomUUID(),
        lines: structuredClone(lines),
        payment,
        note,
      };
      if (!request.lines.length) return null;
      // Persist before sending. A lost response or reload retries the SAME request.
      localStorage.setItem("bb-pending-" + userId, JSON.stringify(request));
      pendingRef.current = request;
      setPending(request);
      const { data, error } = await db.rpc("create_order", {
        p_request_id: request.id,
        p_payment: request.payment,
        p_note: request.note,
        p_lines: request.lines.map((l) => ({
          item_id: l.item.id,
          quantity: l.qty,
          option: l.option,
          addon: l.syrup,
        })),
      });
      if (error) throw error;
      localStorage.removeItem("bb-pending-" + userId);
      pendingRef.current = null;
      setPending(null);
      await refresh();
      return Number(data);
    } catch (e) {
      if (
        e &&
        typeof e === "object" &&
        "code" in e &&
        ["P0001", "42501", "23514", "22P02"].includes(String(e.code))
      ) {
        localStorage.removeItem("bb-pending-" + userId);
        pendingRef.current = null;
        setPending(null);
        setError(message(e) + " Nothing was saved. Please adjust the order.");
        return null;
      }
      setError(
        message(e) +
          " Your order has been kept. Retry confirmation to safely check or finish saving it.",
      );
      return null;
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  }
  return {
    addonPrices,
    menu,
    orders,
    error,
    loading,
    saving,
    submitting,
    pending,
    move,
    checkout,
    refresh,
    synced,
    lastSync: lastSync.current,
  };
}
