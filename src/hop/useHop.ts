import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../supabase";
import { EVENT, uuid, type HopItem } from "./menu";

export type Line = { key: string; item: HopItem; qty: number; option: string };
export type Status = "Queued" | "Preparing" | "Collected" | "Cancelled";
export type Order = {
  id: number;
  no: number;
  version: number;
  lines: Line[];
  payment: "UPI" | "Cash";
  status: Status | "Ready";
  created: number;
  note: string;
  total: number;
  cancellationReason?: string;
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
const pendingKey = (u: string) => `hop-pending-${u}`;

// Same safety model as /staff: server prices, durable request ID for retries,
// version-checked moves. Differences: event-scoped data, per-event ticket numbers,
// and actions resolve as soon as the server answers (refresh runs afterwards).
export function useHop(userId: string) {
  const [menu, setMenu] = useState<HopItem[]>([]),
    [orders, setOrders] = useState<Order[]>([]),
    [refreshError, setRefreshError] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState<Set<number>>(new Set()),
    [submitting, setSubmitting] = useState(false),
    [synced, setSynced] = useState(false),
    [pending, setPending] = useState<Pending | null>(() => {
      try {
        return JSON.parse(localStorage.getItem(pendingKey(userId)) || "null");
      } catch {
        return null;
      }
    });
  const pendingRef = useRef(pending),
    busy = useRef(false),
    locks = useRef(new Set<number>()),
    epoch = useRef(0),
    alive = useRef(true),
    refreshing = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    const n = ++epoch.current;
    try {
      const page = (start: number, ceiling?: number) => {
        let q = db
          .from("orders")
          .select(
            "id,ticket_no,version,payment,status,created_at,note,total_paise,cancellation_reason,order_items(*)",
          )
          .eq("event", EVENT)
          .order("id", { ascending: false })
          .range(start, start + 499);
        if (ceiling !== undefined) q = q.lte("id", ceiling);
        return q;
      };
      const loadOrders = async () => {
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
      const [m, rows] = await Promise.all([
        db
          .from("menu_items")
          .select("*")
          .eq("event", EVENT)
          .eq("available", true)
          .order("sort_order"),
        loadOrders(),
      ]);
      if (m.error) throw m.error;
      if (!alive.current || n !== epoch.current) return;
      const catalog: HopItem[] = m.data.map((x) => ({
        id: x.id,
        name: x.name,
        category: x.category,
        description: x.description,
        art: x.art,
        price: x.price_paise / 100,
        options: x.options,
      }));
      setMenu(catalog);
      const list: Order[] = rows.map((x) => ({
        id: x.id,
        no: x.ticket_no ?? x.id,
        version: x.version,
        payment: x.payment,
        status: x.status,
        created: Date.parse(x.created_at),
        note: x.note,
        total: x.total_paise / 100,
        cancellationReason: x.cancellation_reason ?? undefined,
        lines: [...x.order_items]
          .sort((a, b) => a.id - b.id)
          .map((l) => ({
            key: String(l.id),
            item: {
              ...(catalog.find((c) => c.id === l.menu_item_id) ?? {
                id: l.menu_item_id,
                category: "",
                description: "",
                art: "americano",
                options: [],
              }),
              name: l.name,
              price: l.unit_price_paise / 100,
            },
            qty: l.quantity,
            option: l.option,
          })),
      }));
      setOrders((prev) =>
        list.map((o) => {
          const old = prev.find((p) => p.id === o.id);
          return old &&
            (locks.current.has(o.id) || old.version > o.version)
            ? old
            : o;
        }),
      );
      setRefreshError("");
      setSynced(true);
      setLoading(false);
    } catch (e) {
      if (alive.current && n === epoch.current) {
        setSynced(false);
        setRefreshError(message(e));
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

  const lock = (id: number, on: boolean) => {
    if (on) locks.current.add(id);
    else locks.current.delete(id);
    setSaving(new Set(locks.current));
  };

  async function move(id: number, status: Status, expectedVersion?: number) {
    const order = orders.find((o) => o.id === id);
    if (!order || order.status === status || locks.current.has(id))
      return false;
    if (!navigator.onLine) {
      setError("You’re offline. Reconnect before moving an order.");
      return false;
    }
    epoch.current++;
    lock(id, true);
    setError("");
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      const { data, error } = await db.rpc("move_order", {
        p_order_id: id,
        p_expected_version: expectedVersion ?? order.version,
        p_status: status,
        p_mutation_id: uuid(),
      });
      if (error) throw error;
      setOrders((os) =>
        os.map((o) =>
          o.id === id ? { ...o, status: data.status, version: data.version } : o,
        ),
      );
      return true;
    } catch (e) {
      setOrders((os) => os.map((o) => (o.id === id ? order : o)));
      setError(message(e));
      return false;
    } finally {
      lock(id, false);
      void refresh();
    }
  }

  async function cancel(order: Order, reason: string) {
    if (locks.current.has(order.id)) return false;
    if (!navigator.onLine) {
      setError("Reconnect before cancelling an order.");
      return false;
    }
    epoch.current++;
    lock(order.id, true);
    setError("");
    try {
      const { data, error } = await db.rpc("cancel_order", {
        p_order_id: order.id,
        p_expected_version: order.version,
        p_reason: reason,
        p_mutation_id: uuid(),
      });
      if (error) throw error;
      setOrders((os) =>
        os.map((o) =>
          o.id === order.id
            ? {
                ...o,
                status: data.status,
                version: data.version,
                cancellationReason: data.cancellation_reason,
              }
            : o,
        ),
      );
      return true;
    } catch (e) {
      setError(message(e));
      return false;
    } finally {
      lock(order.id, false);
      void refresh(); // never keep the dialog waiting on a refresh
    }
  }

  async function checkout(lines: Line[], payment: "UPI" | "Cash", note: string) {
    if (busy.current) return null;
    if (!navigator.onLine) {
      setError("You’re offline. Your order is still here; reconnect to save it.");
      return null;
    }
    busy.current = true;
    setSubmitting(true);
    setError("");
    try {
      const request = pendingRef.current ?? {
        id: uuid(),
        lines: structuredClone(lines),
        payment,
        note,
      };
      if (!request.lines.length) return null;
      // Persist before sending: a lost response or reload retries the SAME request.
      localStorage.setItem(pendingKey(userId), JSON.stringify(request));
      pendingRef.current = request;
      setPending(request);
      const { data, error } = await db.rpc("create_event_order", {
        p_event: EVENT,
        p_request_id: request.id,
        p_payment: request.payment,
        p_note: request.note,
        p_lines: request.lines.map((l) => ({
          item_id: l.item.id,
          quantity: l.qty,
          option: l.option,
        })),
      });
      if (error) throw error;
      localStorage.removeItem(pendingKey(userId));
      pendingRef.current = null;
      setPending(null);
      void refresh();
      return Number(data);
    } catch (e) {
      if (
        e &&
        typeof e === "object" &&
        "code" in e &&
        ["P0001", "42501", "23514", "22P02"].includes(String(e.code))
      ) {
        localStorage.removeItem(pendingKey(userId));
        pendingRef.current = null;
        setPending(null);
        setError(message(e) + " Nothing was saved. Please adjust the order.");
        return null;
      }
      setError(
        message(e) +
          " Your order has been kept. Retry to safely check or finish saving it.",
      );
      return null;
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  }

  return {
    menu,
    orders,
    error: error || refreshError,
    clearError: () => setError(""),
    loading,
    saving,
    submitting,
    pending,
    synced,
    move,
    cancel,
    checkout,
    refresh,
  };
}
