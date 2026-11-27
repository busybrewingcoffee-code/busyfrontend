import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  pointerWithin,
  rectIntersection,
} from "@dnd-kit/core";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Banknote,
  Check,
  ChevronDown,
  Columns3,
  Download,
  GripVertical,
  LayoutGrid,
  LogOut,
  Minus,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  Smartphone,
  Snowflake,
  Coffee,
  ChartNoAxesCombined,
  X,
} from "lucide-react";
import { supabase } from "../supabase";
import { HopArt, Logo } from "./HopArt";
import {
  categories,
  dayLabel,
  isAddon,
  istDay,
  istHour,
  optionFor,
  serves,
  variants,
  type HopItem,
  type Temperature,
  uuid,
  picks,
} from "./menu";
import { useHop, type Line, type Order, type Status } from "./useHop";
import "./hop.css";

const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
const sum = (ls: Line[]) => ls.reduce((n, l) => n + l.item.price * l.qty, 0);
const columns: { status: Status; title: string; hint: string }[] = [
  { status: "Queued", title: "New", hint: "Waiting for the bar" },
  { status: "Preparing", title: "Brewing", hint: "On the machine" },
  { status: "Collected", title: "Done", hint: "Handed over" },
];
// Legacy "Ready" (from the 4-column board) counts as done.
const stageOf = (o: Order): Status =>
  o.status === "Ready" ? "Collected" : (o.status as Status);
const ago = (ms: number) => {
  const m = Math.max(0, Math.floor((Date.now() - ms) / 60000));
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.floor(m / 60)} h ${m % 60} min ago`;
};
const read = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode: the app still works, the draft just isn't remembered */
  }
};

function LineList({ lines }: { lines: Line[] }) {
  return (
    <ul className="h-lines">
      {lines.map((l) => (
        <li key={l.key} className={isAddon(l.item) ? "is-addon" : ""}>
          <b>{l.qty}</b>
          <div>
            {isAddon(l.item) ? `+ ${l.item.name}` : l.item.name}
            {l.option && <small>{l.option}</small>}
          </div>
        </li>
      ))}
    </ul>
  );
}

function TicketHead({ o }: { o: Order }) {
  return (
    <>
      <strong>#{o.no}</strong>
      <span className="h-ticket-meta">
        <GripVertical size={16} aria-hidden="true" />
        {ago(o.created)}
      </span>
    </>
  );
}

function TicketBody({
  o,
  head,
  move,
  cancel,
}: {
  o: Order;
  head?: React.ReactNode;
  move: (o: Order, s: Status) => void;
  cancel?: (o: Order) => void;
}) {
  const stage = stageOf(o);
  return (
    <>
      {head ?? (
        <div className="h-ticket-head">
          <TicketHead o={o} />
        </div>
      )}
      <LineList lines={o.lines} />
      {o.note && <p className="h-ticket-note">{o.note}</p>}
      <div className="h-ticket-pay">
        <span>
          <Check size={13} />
          Paid · {o.payment}
        </span>
        <strong>{money(o.total)}</strong>
      </div>
      {stage === "Queued" && (
        <button className="h-advance" onClick={() => move(o, "Preparing")}>
          Start brewing <ArrowRight size={15} />
        </button>
      )}
      {stage === "Preparing" && (
        <button className="h-advance is-done" onClick={() => move(o, "Collected")}>
          Mark done <Check size={15} />
        </button>
      )}
      <div className="h-ticket-links">
        {stage !== "Queued" && (
          <button onClick={() => move(o, stage === "Collected" ? "Preparing" : "Queued")}>
            <RotateCcw size={12} /> Move back
          </button>
        )}
        {cancel && <button onClick={() => cancel(o)}>Cancel order</button>}
      </div>
    </>
  );
}

function DragTicket({
  o,
  move,
  cancel,
  saving,
}: {
  o: Order;
  move: (o: Order, s: Status) => void;
  cancel: (o: Order) => void;
  saving: boolean;
}) {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, isDragging } =
    useDraggable({ id: o.id });
  return (
    <article
      ref={setNodeRef}
      className={`h-ticket ${isDragging ? "is-source" : ""} ${saving ? "is-saving" : ""}`}
      aria-busy={saving}
      onMouseDown={(e) => {
        if (!(e.target as Element).closest("button, a, input"))
          listeners?.onMouseDown?.(e);
      }}
    >
      <TicketBody
        o={o}
        move={move}
        cancel={cancel}
        head={
          <button
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            className="h-ticket-head"
            aria-label={`Move order ${o.no}`}
          >
            <TicketHead o={o} />
          </button>
        }
      />
    </article>
  );
}

function Column({ status, children }: { status: Status; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section ref={setNodeRef} className={`h-column h-col-${status} ${isOver ? "is-over" : ""}`}>
      {children}
    </section>
  );
}


export default function HopApp({ userId }: { userId: string }) {
  const hop = useHop(userId);
  const { menu, orders } = hop;
  const [tab, setTab] = useState<"Counter" | "Board" | "Sales">(() =>
    read("hop-tab", "Counter"),
  );
  const [category, setCategory] = useState("All");
  const [temp, setTemp] = useState<Temperature>(() => read("hop-temp", "Iced"));
  const [search, setSearch] = useState("");
  const [basket, setBasket] = useState<Line[]>(() =>
    read(`hop-draft-${userId}`, []),
  );
  const [payment, setPayment] = useState<"UPI" | "Cash">("UPI");
  const [note, setNote] = useState("");
  const [toast, setToast] = useState("");
  const [bump, setBump] = useState<number | null>(null);
  const [sheet, setSheet] = useState(false);
  const [cancelling, setCancelling] = useState<Order | null>(null);
  const [reason, setReason] = useState("");
  const [dragging, setDragging] = useState<number | null>(null);
  const [showAllDone, setShowAllDone] = useState(false);
  const [day, setDay] = useState<string | null>(null);
  const dragVersion = useRef<number | undefined>(undefined);
  const [, tick] = useState(0);

  useEffect(() => write(`hop-draft-${userId}`, basket), [basket, userId]);
  useEffect(() => write("hop-temp", temp), [temp]);
  useEffect(() => write("hop-tab", tab), [tab]);
  useEffect(() => {
    document.title = "Busy Brewing · Horn OK Please";
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  // ---- counter
  const add = (item: HopItem, option: string) => {
    setBasket((b) => {
      const last = b[b.length - 1];
      // Same thing tapped again right away → quantity. Otherwise a new line,
      // so an add-on always sits directly under the drink it belongs to.
      if (last && last.item.id === item.id && last.option === option)
        return b.map((l, i) =>
          i === b.length - 1 ? { ...l, qty: Math.min(99, l.qty + 1) } : l,
        );
      return [...b, { key: uuid(), item, qty: 1, option }];
    });
    setBump(item.id);
    setTimeout(() => setBump((x) => (x === item.id ? null : x)), 350);
  };
  const change = (key: string, n: number) =>
    setBasket((b) =>
      b
        .map((l) => (l.key === key ? { ...l, qty: Math.min(99, l.qty + n) } : l))
        .filter((l) => l.qty > 0),
    );
  const inBasket = (id: number) =>
    basket.filter((l) => l.item.id === id).reduce((n, l) => n + l.qty, 0);
  const drinks = menu.filter((i) => !isAddon(i));
  const addons = menu.filter(isAddon);
  const q = search.trim().toLowerCase();
  const visible = drinks.filter(
    (i) =>
      serves(i, temp) &&
      (category === "All" || i.category === category) &&
      (!q || `${i.name} ${i.description}`.toLowerCase().includes(q)),
  );
  const groups = categories
    .slice(1)
    .map((c) => [c, visible.filter((i) => i.category === c)] as const)
    .filter(([, items]) => items.length);
  const units = basket.reduce((n, l) => n + l.qty, 0);
  const basketTotal = sum(basket);
  const confirm = async () => {
    const id = await hop.checkout(basket, payment, note);
    if (id !== null) {
      setBasket([]);
      setNote("");
      setPayment("UPI");
      setSheet(false);
      setToast("Order saved · it’s on the board");
    }
  };

  // ---- board
  const move = async (o: Order, status: Status, version?: number) => {
    if (await hop.move(o.id, status, version))
      setToast(
        `#${o.no} → ${columns.find((c) => c.status === status)?.title ?? status}`,
      );
  };
  const live = orders.filter((o) => o.status !== "Cancelled");
  const byStage = (s: Status) => {
    const list = live.filter((o) => stageOf(o) === s);
    return s === "Collected"
      ? list.sort((a, b) => b.id - a.id)
      : list.sort((a, b) => a.id - b.id);
  };
  const openCount = live.filter((o) => stageOf(o) !== "Collected").length;

  // ---- sales
  const days = useMemo(
    () =>
      [...new Set(orders.map((o) => istDay(o.created)))].sort().reverse(),
    [orders],
  );
  const today = istDay(Date.now());
  const activeDay = day ?? (days.includes(today) ? today : "All");
  const inDay = orders.filter(
    (o) => activeDay === "All" || istDay(o.created) === activeDay,
  );
  const sold = inDay.filter((o) => o.status !== "Cancelled");
  const stats = useMemo(() => {
    const sales = sold.reduce((n, o) => n + o.total, 0);
    const pay = (p: string) => sold.filter((o) => o.payment === p);
    const items = new Map<string, { qty: number; revenue: number; addon: boolean }>();
    let drinkUnits = 0,
      addonUnits = 0,
      hot = 0,
      iced = 0;
    const cats = new Map<string, number>();
    for (const o of sold)
      for (const l of o.lines) {
        const a = isAddon(l.item);
        const e = items.get(l.item.name) ?? { qty: 0, revenue: 0, addon: a };
        e.qty += l.qty;
        e.revenue += l.qty * l.item.price;
        items.set(l.item.name, e);
        if (a) addonUnits += l.qty;
        else {
          drinkUnits += l.qty;
          if (l.option === "Hot") hot += l.qty;
          else iced += l.qty;
          cats.set(l.item.category, (cats.get(l.item.category) ?? 0) + l.qty);
        }
      }
    const hours = new Map<number, { orders: number; sales: number }>();
    for (const o of sold) {
      const h = istHour(o.created);
      const e = hours.get(h) ?? { orders: 0, sales: 0 };
      e.orders++;
      e.sales += o.total;
      hours.set(h, e);
    }
    return {
      sales,
      upi: pay("UPI"),
      cash: pay("Cash"),
      drinkUnits,
      addonUnits,
      hot,
      iced,
      top: [...items.entries()]
        .filter(([, v]) => !v.addon)
        .sort((a, b) => b[1].qty - a[1].qty)
        .slice(0, 10),
      addonList: [...items.entries()]
        .filter(([, v]) => v.addon)
        .sort((a, b) => b[1].qty - a[1].qty),
      cats: [...cats.entries()].sort((a, b) => b[1] - a[1]),
      // Every hour from first to last sale, including quiet ones. A night that
      // runs past midnight reads 10p → 11p → 12a → 1a (start after the longest gap).
      hours: (() => {
        const hs = [...hours.keys()].sort((a, b) => a - b);
        if (!hs.length) return [];
        let start = hs[0],
          gap = hs[0] + 24 - hs[hs.length - 1];
        for (let i = 1; i < hs.length; i++)
          if (hs[i] - hs[i - 1] > gap) {
            gap = hs[i] - hs[i - 1];
            start = hs[i];
          }
        const span = 24 - gap + 1;
        return Array.from({ length: span }, (_, i) => {
          const h = (start + i) % 24;
          return [h, hours.get(h) ?? { orders: 0, sales: 0 }] as const;
        });
      })(),
    };
  }, [sold]);
  const cancelled = inDay.filter((o) => o.status === "Cancelled");
  const exportCsv = () => {
    const rows = [
      ["Day (IST)", "Ticket", "Time", "Item", "Option", "Qty", "Unit INR", "Payment", "Status", "Order total INR"],
      ...inDay.flatMap((o) =>
        o.lines.map((l) => [
          istDay(o.created),
          o.no,
          new Date(o.created).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }),
          `"${l.item.name}"`,
          l.option,
          l.qty,
          l.item.price,
          o.payment,
          o.status,
          o.total,
        ]),
      ),
    ];
    const url = URL.createObjectURL(
      new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `busy-brewing-hop-${activeDay}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxHour = Math.max(1, ...stats.hours.map(([, v]) => v.orders));
  const maxTop = Math.max(1, ...stats.top.map(([, v]) => v.qty));
  const status = hop.loading ? "Connecting" : hop.synced ? "Live" : "Offline";

  const optionLabel = (i: HopItem) => {
    const vs = variants(i);
    if (vs.length) return vs.map((v) => v.replace(" Coke", "")).join(" / ");
    return i.options.length === 1 ? `${i.options[0]} only` : "Hot / Iced";
  };

  return (
    <div className="hop">
      <header className="h-header">
        <a className="h-brand" href="/hop" aria-label="Busy Brewing">
          <Logo className="h-logo" />
          <span>
            BUSY
            <br />
            BREWING
            <small>THE STALL WORKSPACE</small>
          </span>
        </a>
        <nav className="h-nav" aria-label="Workspace">
          {(
            [
              ["Counter", LayoutGrid],
              ["Board", Columns3],
              ["Sales", ChartNoAxesCombined],
            ] as const
          ).map(([name, Icon]) => (
            <button
              key={name}
              className={tab === name ? "is-active" : ""}
              aria-current={tab === name ? "page" : undefined}
              onClick={() => setTab(name)}
            >
              <Icon size={17} />
              <span>{name}</span>
              {name === "Board" && <b>{openCount}</b>}
            </button>
          ))}
        </nav>
        <div className="h-session">
          <div>
            <span className={`h-dot is-${status.toLowerCase()}`} />
            Horn OK Please
            <small>{status === "Live" ? "The Season Between" : status}</small>
          </div>
          <button
            className="h-icon-btn"
            aria-label="Sign out"
            title="Sign out"
            onClick={() => {
              if (basket.length || hop.pending) {
                setToast("Finish or clear the current order first");
                return;
              }
              void supabase!.auth.signOut();
            }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      {hop.error && (
        <div className="h-banner" role="alert">
          <span>{hop.error}</span>
          <button onClick={() => (hop.clearError(), hop.refresh())}>Refresh</button>
        </div>
      )}
      {hop.pending && (
        <div className="h-banner is-warn" role="status">
          <span>The last order needs confirming. It will never be saved twice.</span>
          <button disabled={hop.submitting} onClick={confirm}>
            {hop.submitting ? "Checking…" : "Retry confirmation"}
          </button>
        </div>
      )}

      {tab === "Counter" && (
        <main className={`h-counter ${hop.pending || hop.submitting ? "is-locked" : ""}`}>
          <section className="h-catalog">
            <div className="h-catalog-scroll">
              <div className="h-heading">
                <div>
                  <p className="h-eyebrow">THE SEASON BETWEEN</p>
                  <h1>Something warm, something iced.</h1>
                </div>
                <span className="h-quiet">{drinks.length} drinks</span>
              </div>
              <label className="h-search">
                <Search size={17} />
                <input
                  aria-label="Search the menu"
                  placeholder="Find a drink…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button aria-label="Clear search" onClick={() => setSearch("")}>
                    <X size={15} />
                  </button>
                )}
              </label>
              <div className="h-controls">
                <div className="h-cats" aria-label="Menu sections">
                  {categories.map((c) => (
                    <button
                      key={c}
                      aria-pressed={c === category}
                      className={c === category ? "is-on" : ""}
                      onClick={() => setCategory(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="h-temp" role="group" aria-label="Hot or iced drinks">
                  <span className={`h-temp-thumb ${temp === "Iced" ? "is-iced" : ""}`} />
                  {(["Hot", "Iced"] as const).map((t) => (
                    <button
                      key={t}
                      aria-label={`${t} drinks`}
                      title={`${t} drinks`}
                      aria-pressed={temp === t}
                      onClick={() => setTemp(t)}
                    >
                      {t === "Hot" ? <Coffee size={21} /> : <Snowflake size={21} />}
                    </button>
                  ))}
                </div>
              </div>

              {groups.map(([cat, items]) => (
                <section key={cat} className="h-group">
                  <div className="h-section-label">
                    <h2>{cat}</h2>
                    <span>
                      {money(items[0].price)} · {plural(items.length, "drink")}
                    </span>
                  </div>
                  <div className="h-grid">
                    {items.map((i) => {
                      const vs = variants(i);
                      const count = inBasket(i.id);
                      const opt = optionFor(i, temp);
                      const tile = (
                        <div className={`h-tile ${picks.has(i.id) ? "is-pick" : ""}`}>
                          <HopArt kind={i.art} option={vs.length ? vs[0] : opt} />
                          {picks.has(i.id) && <span className="h-pick">SEASON’S PICK</span>}
                          {count > 0 && <span className="h-count">{count}</span>}
                          {!vs.length && (
                            <span className="h-add">
                              <Plus size={16} />
                            </span>
                          )}
                        </div>
                      );
                      const copy = (
                        <div className="h-copy">
                          <h3>{i.name}</h3>
                          <div>
                            <strong>{money(i.price)}</strong>
                            <span>{optionLabel(i)}</span>
                          </div>
                        </div>
                      );
                      return (
                        <div key={i.id} className={`h-entry ${bump === i.id ? "is-bump" : ""}`}>
                          {vs.length ? (
                            <>
                              {tile}
                              {copy}
                              <div className="h-variants">
                                {vs.map((v) => (
                                  <button key={v} onClick={() => add(i, v)} aria-label={`Add ${i.name}, ${v}`}>
                                    {v.replace(" Coke", "")}
                                    <Plus size={13} />
                                  </button>
                                ))}
                              </div>
                            </>
                          ) : (
                            <button
                              className="h-item"
                              onClick={() => add(i, opt)}
                              aria-label={`Add ${opt} ${i.name}, ${money(i.price)}`}
                            >
                              {tile}
                              {copy}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
              {!groups.length && (
                <div className="h-empty">
                  <h3>Nothing {temp === "Hot" ? "hot" : "iced"} here</h3>
                  <p>{q ? `No drink matches “${search}”.` : "Try the other temperature or another section."}</p>
                  <button
                    onClick={() => {
                      setSearch("");
                      setCategory("All");
                    }}
                  >
                    Show the whole menu
                  </button>
                </div>
              )}
              <footer className="h-footer">
                Made for good coffee & a happy little rush.
                <span>BUSY BREWING</span>
              </footer>
            </div>

            <section className="h-addons" aria-label="Add-ons">
              <p className="h-eyebrow">
                ADD-ONS · ₹40 <span>goes in the drink above it</span>
              </p>
              <div>
                {addons.map((a) => (
                  <button
                    key={a.id}
                    className={bump === a.id ? "is-bump" : ""}
                    disabled={!basket.length}
                    onClick={() => add(a, "")}
                    aria-label={`Add ${a.name} for ₹40 to the last drink`}
                  >
                    <HopArt kind={a.art} />
                    <span>{a.name}</span>
                  </button>
                ))}
              </div>
            </section>
          </section>

          <aside className={`h-basket ${sheet ? "is-open" : ""}`} aria-label="Current order">
            <div className="h-basket-head">
              <div>
                <p className="h-eyebrow">AT THE COUNTER</p>
                <h2>
                  New order <span>{units || "–"}</span>
                </h2>
              </div>
              {basket.length > 0 ? (
                <button className="h-clear" onClick={() => setBasket([])}>
                  Clear
                </button>
              ) : (
                <ShoppingBag className="h-bag" size={22} />
              )}
              <button className="h-sheet-close" aria-label="Close order" onClick={() => setSheet(false)}>
                <ChevronDown size={22} />
              </button>
            </div>
            {basket.length ? (
              <ol className="h-basket-lines">
                {basket.map((l) => (
                  <li key={l.key} className={isAddon(l.item) ? "is-addon" : ""}>
                    <div className="h-mini">
                      <HopArt kind={l.item.art} option={l.option} />
                    </div>
                    <div className="h-line-copy">
                      <h3>{l.item.name}</h3>
                      <p>{isAddon(l.item) ? "Add-on" : l.option}</p>
                    </div>
                    <div className="h-qty">
                      <button aria-label={`One less ${l.item.name}`} onClick={() => change(l.key, -1)}>
                        <Minus size={13} />
                      </button>
                      <span>{l.qty}</span>
                      <button aria-label={`One more ${l.item.name}`} onClick={() => change(l.key, 1)}>
                        <Plus size={13} />
                      </button>
                    </div>
                    <strong>{money(l.item.price * l.qty)}</strong>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="h-basket-empty">
                <HopArt kind="cinnamon-latte" option="Hot" />
                <h3>What are we brewing?</h3>
                <p>
                  Tap a drink to start an order.
                  <br />
                  Add-ons go right under it.
                </p>
              </div>
            )}
            <div className="h-basket-foot">
              <label className="h-note">
                A little note <span>optional</span>
                <input
                  value={note}
                  maxLength={200}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Less ice, a name…"
                />
              </label>
              <div className="h-total">
                <span>Total</span>
                <strong>{money(basketTotal)}</strong>
              </div>
              <div className="h-pay" aria-label="Payment method">
                {(["UPI", "Cash"] as const).map((p) => (
                  <button
                    key={p}
                    aria-pressed={payment === p}
                    className={payment === p ? "is-on" : ""}
                    onClick={() => setPayment(p)}
                  >
                    {p === "UPI" ? <Smartphone size={17} /> : <Banknote size={18} />}
                    {p}
                    {payment === p && <Check size={14} />}
                  </button>
                ))}
              </div>
              <button
                className="h-primary h-checkout"
                disabled={!basket.length || hop.submitting || hop.loading || !hop.synced}
                onClick={confirm}
              >
                <span>{hop.submitting ? "Saving order…" : `Confirm ${payment} received`}</span>
                <ArrowRight size={18} />
              </button>
              <p className="h-hint">Record payment after checking cash or UPI receipt</p>
            </div>
          </aside>
          <button className="h-sheet-open h-primary" onClick={() => setSheet(true)}>
            <ShoppingBag size={18} />
            View order · {units}
            <strong>{money(basketTotal)}</strong>
          </button>
        </main>
      )}

      {tab === "Board" && (
        <main className="h-board-page">
          <div className="h-heading">
            <div>
              <p className="h-eyebrow">ONE ORDER AT A TIME</p>
              <h1>A little organised chaos.</h1>
            </div>
            <button className="h-primary" onClick={() => setTab("Counter")}>
              <Plus size={17} /> New order
            </button>
          </div>
          <div className="h-board-meta">
            <span>
              <span className="h-dot is-live" />
              {plural(openCount, "order")} in the works
            </span>
            <span>Tap to update · drag the ticket header to move</span>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={(a) => (a.pointerCoordinates ? pointerWithin(a) : rectIntersection(a))}
            onDragStart={({ active }) => {
              dragVersion.current = orders.find((o) => o.id === Number(active.id))?.version;
              setDragging(Number(active.id));
            }}
            onDragCancel={() => setDragging(null)}
            onDragEnd={({ active, over }) => {
              const o = orders.find((x) => x.id === Number(active.id));
              if (o && over && columns.some((c) => c.status === over.id) && stageOf(o) !== over.id)
                void move(o, over.id as Status, dragVersion.current);
              setDragging(null);
            }}
          >
            <div className={`h-board ${dragging !== null ? "is-dragging" : ""}`}>
              {columns.map((c) => {
                const list = byStage(c.status);
                const shown = c.status === "Collected" && !showAllDone ? list.slice(0, 12) : list;
                return (
                  <Column key={c.status} status={c.status}>
                    <div className="h-column-head">
                      <h2>
                        <i />
                        {c.title}
                      </h2>
                      <span>{list.length}</span>
                    </div>
                    <div className="h-tickets">
                      {shown.map((o) => (
                        <DragTicket
                          key={o.id}
                          o={o}
                          move={move}
                          cancel={(x) => {
                            setCancelling(x);
                            setReason("");
                          }}
                          saving={hop.saving.has(o.id)}
                        />
                      ))}
                      {!list.length && (
                        <div className="h-column-empty">
                          <Coffee size={24} />
                          <p>{c.hint}</p>
                        </div>
                      )}
                      {c.status === "Collected" && list.length > 12 && (
                        <button className="h-more" onClick={() => setShowAllDone((v) => !v)}>
                          {showAllDone ? "Show fewer" : `Show all ${list.length}`}
                        </button>
                      )}
                    </div>
                  </Column>
                );
              })}
            </div>
            <DragOverlay dropAnimation={null}>
              {dragging !== null && orders.find((o) => o.id === dragging) ? (
                <article className="h-ticket is-overlay">
                  <TicketBody o={orders.find((o) => o.id === dragging)!} move={() => {}} />
                </article>
              ) : null}
            </DragOverlay>
          </DndContext>
        </main>
      )}

      {tab === "Sales" && (
        <main className="h-sales">
          <div className="h-heading">
            <div>
              <p className="h-eyebrow">THE EVENT, SO FAR</p>
              <h1>Every little cup counts.</h1>
            </div>
            <button className="h-secondary" onClick={exportCsv}>
              <Download size={16} /> Export sales
            </button>
          </div>
          <div className="h-cats h-days" aria-label="Day">
            {["All", ...days].map((d) => (
              <button
                key={d}
                aria-pressed={activeDay === d}
                className={activeDay === d ? "is-on" : ""}
                onClick={() => setDay(d)}
              >
                {d === "All" ? "All days" : d === today ? "Today" : dayLabel(d)}
              </button>
            ))}
          </div>
          <div className="h-strip">
            <div>
              <p>Total sales</p>
              <h2>{money(stats.sales)}</h2>
              <small>Excludes cancelled orders</small>
            </div>
            <div>
              <p>Orders</p>
              <h2>{sold.length}</h2>
              <small>{money(sold.length ? Math.round(stats.sales / sold.length) : 0)} on average</small>
            </div>
            <div>
              <p>Drinks</p>
              <h2>{stats.drinkUnits}</h2>
              <small>
                {stats.hot} hot · {stats.iced} iced · {stats.addonUnits} add-ons
              </small>
            </div>
            <div>
              <p>UPI / Cash</p>
              <h2>{money(stats.upi.reduce((n, o) => n + o.total, 0))}</h2>
              <small>{money(stats.cash.reduce((n, o) => n + o.total, 0))} in cash</small>
            </div>
          </div>
          <div className="h-panels">
            <section>
              <h2 className="h-ledger-title">Bestsellers</h2>
              {stats.top.length ? (
                <ol className="h-bars">
                  {stats.top.map(([name, v]) => (
                    <li key={name}>
                      <span>{name}</span>
                      <i>
                        <i style={{ width: `${(v.qty / maxTop) * 100}%` }} />
                      </i>
                      <b>{v.qty}</b>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="h-quiet">No sales yet.</p>
              )}
              {stats.addonList.length > 0 && (
                <p className="h-tally">
                  Add-ons: {stats.addonList.map(([n, v]) => `${n} ${v.qty}`).join(" · ")}
                </p>
              )}
            </section>
            <section>
              <h2 className="h-ledger-title">Orders by hour</h2>
              {stats.hours.length ? (
                <div className="h-hours">
                  {stats.hours.map(([h, v]) => (
                    <div key={h} title={`${v.orders} orders · ${money(v.sales)}`}>
                      <b>{v.orders || ""}</b>
                      <i style={{ height: `${(v.orders / maxHour) * 100}%` }} />
                      <span>
                        {((h + 11) % 12) + 1}
                        {h < 12 ? "a" : "p"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="h-quiet">No orders yet.</p>
              )}
              {stats.cats.length > 0 && (
                <p className="h-tally">{stats.cats.map(([c, n]) => `${c} ${n}`).join(" · ")}</p>
              )}
            </section>
          </div>
          <h2 className="h-ledger-title">The order book</h2>
          {cancelled.length > 0 && (
            <p className="h-cancelled">
              {cancelled.length} cancelled · {money(cancelled.reduce((n, o) => n + o.total, 0))} originally
              recorded as paid. Check any cash or UPI refunds separately.
            </p>
          )}
          <div className="h-table">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Time</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inDay.map((o) => (
                  <tr key={o.id} className={o.status === "Cancelled" ? "is-cancelled" : ""}>
                    <td>#{o.no}</td>
                    <td>
                      {new Date(o.created).toLocaleTimeString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>
                      {o.lines
                        .map((l) => `${l.qty} × ${isAddon(l.item) ? "+ " : ""}${l.item.name}${l.option ? ` (${l.option})` : ""}`)
                        .join(", ")}
                      {o.status === "Cancelled" && <small>Cancelled · {o.cancellationReason}</small>}
                    </td>
                    <td>{o.payment}</td>
                    <td>{money(o.total)}</td>
                    <td>
                      <button
                        className="h-link"
                        disabled={hop.saving.has(o.id)}
                        onClick={() =>
                          o.status === "Cancelled" ? void move(o, "Queued") : (setCancelling(o), setReason(""))
                        }
                      >
                        {o.status === "Cancelled" ? "Restore to queue" : "Cancel"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      )}

      {cancelling && (
        <div className="h-modal" onClick={() => !hop.saving.has(cancelling.id) && setCancelling(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="h-cancel-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.key === "Escape" && setCancelling(null)}
          >
            <p className="h-eyebrow">ORDER #{cancelling.no}</p>
            <h2 id="h-cancel-title">Cancel this order?</h2>
            <p>
              It will leave the board and stay in your order book. This does not refund the{" "}
              {money(cancelling.total)} payment.
            </p>
            <div className="h-reasons">
              {["Wrong entry", "Customer left", "Duplicate", "Test"].map((r) => (
                <button key={r} className={reason === r ? "is-on" : ""} onClick={() => setReason(r)}>
                  {r}
                </button>
              ))}
            </div>
            <label>
              Reason
              <input
                autoFocus
                value={reason}
                maxLength={200}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Customer changed their mind…"
              />
            </label>
            <div className="h-modal-actions">
              <button className="h-secondary" onClick={() => setCancelling(null)}>
                Keep order
              </button>
              <button
                className="h-primary"
                disabled={!reason.trim() || hop.saving.has(cancelling.id)}
                onClick={async () => {
                  const o = cancelling;
                  if (await hop.cancel(o, reason.trim())) {
                    setCancelling(null);
                    setToast(`Order #${o.no} cancelled`);
                  }
                }}
              >
                {hop.saving.has(cancelling.id) ? "Cancelling…" : "Cancel order"}
              </button>
            </div>
          </section>
        </div>
      )}

      {toast && (
        <div className={`h-toast ${tab === "Counter" ? "is-raised" : ""}`} role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}
