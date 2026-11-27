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
  TrendingUp,
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
  return m < 1 ? "just now" : m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} m`;
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
          <span>
            {isAddon(l.item) && <i aria-hidden="true">+</i>}
            {l.item.name}
            {l.option && <small>{l.option}</small>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function TicketHead({ o }: { o: Order }) {
  return (
    <>
      <span className="h-ticket-id">
        <strong>#{o.no}</strong>
        <small>{ago(o.created)}</small>
      </span>
      <GripVertical className="h-grip" size={20} aria-hidden="true" />
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
          {o.payment === "UPI" ? <Smartphone size={13} /> : <Banknote size={14} />}
          {o.payment}
        </span>
        <strong>{money(o.total)}</strong>
      </div>
      {stage === "Queued" && (
        <button className="h-advance" onClick={() => move(o, "Preparing")}>
          Start brewing <ArrowRight size={16} />
        </button>
      )}
      {stage === "Preparing" && (
        <button className="h-advance done" onClick={() => move(o, "Collected")}>
          Done <Check size={16} />
        </button>
      )}
      <div className="h-ticket-links">
        {stage !== "Queued" && (
          <button
            onClick={() =>
              move(o, stage === "Collected" ? "Preparing" : "Queued")
            }
          >
            <RotateCcw size={12} /> Back
          </button>
        )}
        {cancel && <button onClick={() => cancel(o)}>Cancel</button>}
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

function Column({
  status,
  children,
}: {
  status: Status;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      className={`h-column h-col-${status} ${isOver ? "is-over" : ""}`}
    >
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
      // Every hour from first to last sale, including quiet ones.
      hours: hours.size
        ? Array.from(
            { length: Math.max(...hours.keys()) - Math.min(...hours.keys()) + 1 },
            (_, i) => {
              const h = Math.min(...hours.keys()) + i;
              return [h, hours.get(h) ?? { orders: 0, sales: 0 }] as const;
            },
          )
        : [],
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

  return (
    <div className="hop">
      <div className="h-stripe" aria-hidden="true" />
      <header className="h-header">
        <a className="h-brand" href="/hop" aria-label="Busy Brewing at Horn OK Please">
          <Logo className="h-logo" />
          <span>
            <strong>Busy Brewing</strong>
            <em>The Season Between</em>
          </span>
        </a>
        <nav className="h-nav" aria-label="Workspace">
          {(
            [
              ["Counter", LayoutGrid],
              ["Board", Columns3],
              ["Sales", TrendingUp],
            ] as const
          ).map(([name, Icon]) => (
            <button
              key={name}
              className={tab === name ? "is-active" : ""}
              aria-current={tab === name ? "page" : undefined}
              onClick={() => setTab(name)}
            >
              <Icon size={18} />
              <span>{name}</span>
              {name === "Board" && openCount > 0 && <b>{openCount}</b>}
            </button>
          ))}
        </nav>
        <div className="h-session">
          <span className={`h-status is-${status.toLowerCase()}`}>
            <i />
            {status}
          </span>
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
            <LogOut size={18} />
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
            {hop.submitting ? "Checking…" : "Retry"}
          </button>
        </div>
      )}

      {tab === "Counter" && (
        <main className={`h-counter ${hop.pending || hop.submitting ? "is-locked" : ""}`}>
          <section className="h-catalog">
            <div className="h-controls">
              <div className="h-cats" role="tablist" aria-label="Menu sections">
                {categories.map((c) => (
                  <button
                    key={c}
                    role="tab"
                    aria-selected={c === category}
                    className={c === category ? "is-on" : ""}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="h-tools">
                <label className="h-search">
                  <Search size={16} />
                  <input
                    aria-label="Search the menu"
                    placeholder="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button aria-label="Clear search" onClick={() => setSearch("")}>
                      <X size={14} />
                    </button>
                  )}
                </label>
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
            </div>

            <div className="h-menu">
              {groups.map(([cat, items]) => (
                <section key={cat} className="h-group">
                  <h2>
                    {cat}
                    <span>{money(items[0].price)}</span>
                  </h2>
                  <div className="h-grid">
                    {items.map((i) => {
                      const vs = variants(i);
                      const count = inBasket(i.id);
                      const opt = optionFor(i, temp);
                      return (
                        <div
                          key={i.id}
                          className={`h-card ${bump === i.id ? "is-bump" : ""} ${vs.length ? "has-variants" : ""}`}
                        >
                          {count > 0 && <span className="h-count">{count}</span>}
                          {vs.length ? (
                            <>
                              <div className="h-card-art">
                                <HopArt kind={i.art} option={vs[0]} />
                              </div>
                              <div className="h-card-copy">
                                <h3>{i.name}</h3>
                                <p>{i.description}</p>
                              </div>
                              <div className="h-variants">
                                {vs.map((v) => (
                                  <button
                                    key={v}
                                    onClick={() => add(i, v)}
                                    aria-label={`Add ${i.name}, ${v}`}
                                  >
                                    {v.replace(" Coke", "")}
                                    <Plus size={14} />
                                  </button>
                                ))}
                              </div>
                            </>
                          ) : (
                            <button
                              className="h-card-hit"
                              onClick={() => add(i, opt)}
                              aria-label={`Add ${opt} ${i.name}, ${money(i.price)}`}
                            >
                              <div className="h-card-art">
                                <HopArt kind={i.art} option={opt} />
                                <span className="h-plus">
                                  <Plus size={16} />
                                </span>
                              </div>
                              <div className="h-card-copy">
                                <h3>{i.name}</h3>
                                <p>{i.description}</p>
                              </div>
                              {i.options.length === 1 && (
                                <span className="h-only">{i.options[0]} only</span>
                              )}
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
                  <Snowflake size={26} />
                  <p>
                    Nothing {temp === "Hot" ? "hot" : "iced"} here
                    {q ? ` for “${search}”` : ""}.
                  </p>
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
            </div>

            <section className="h-addons" aria-label="Add-ons">
              <p>
                <strong>Add-ons ₹40</strong>
                <span>Goes in the drink above it</span>
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
              <h2>
                Order <span>{units ? `${units} item${units > 1 ? "s" : ""}` : "empty"}</span>
              </h2>
              {basket.length > 0 && (
                <button className="h-clear" onClick={() => setBasket([])}>
                  Clear
                </button>
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
                        <Minus size={14} />
                      </button>
                      <span>{l.qty}</span>
                      <button aria-label={`One more ${l.item.name}`} onClick={() => change(l.key, 1)}>
                        <Plus size={14} />
                      </button>
                    </div>
                    <strong>{money(l.item.price * l.qty)}</strong>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="h-basket-empty">
                <HopArt kind="cinnamon-latte" option="Iced" />
                <p>Tap a drink to start.</p>
                <small>Add-ons go right under the drink they belong to.</small>
              </div>
            )}
            <div className="h-basket-foot">
              <input
                className="h-note"
                value={note}
                maxLength={200}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note (less ice, name…)"
                aria-label="Order note"
              />
              <div className="h-pay" role="radiogroup" aria-label="Payment">
                {(["UPI", "Cash"] as const).map((p) => (
                  <button
                    key={p}
                    role="radio"
                    aria-checked={payment === p}
                    className={payment === p ? "is-on" : ""}
                    onClick={() => setPayment(p)}
                  >
                    {p === "UPI" ? <Smartphone size={17} /> : <Banknote size={18} />}
                    {p}
                  </button>
                ))}
              </div>
              <button
                className="h-confirm"
                disabled={!basket.length || hop.submitting || hop.loading || !hop.synced}
                onClick={confirm}
              >
                <span>{hop.submitting ? "Saving…" : `${payment} received`}</span>
                <strong>{money(basketTotal)}</strong>
              </button>
            </div>
          </aside>
          <button className="h-sheet-open" onClick={() => setSheet(true)}>
            <ShoppingBag size={18} />
            Order · {units}
            <strong>{money(basketTotal)}</strong>
          </button>
        </main>
      )}

      {tab === "Board" && (
        <main className="h-board-page">
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
                const shown =
                  c.status === "Collected" && !showAllDone ? list.slice(0, 12) : list;
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
                      {!list.length && <p className="h-column-empty">{c.hint}</p>}
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
          <div className="h-sales-top">
            <div className="h-days" role="tablist" aria-label="Day">
              {["All", ...days].map((d) => (
                <button
                  key={d}
                  role="tab"
                  aria-selected={activeDay === d}
                  className={activeDay === d ? "is-on" : ""}
                  onClick={() => setDay(d)}
                >
                  {d === "All" ? "All days" : d === today ? "Today" : dayLabel(d)}
                </button>
              ))}
            </div>
            <button className="h-ghost" onClick={exportCsv}>
              <Download size={16} /> Export CSV
            </button>
          </div>
          <p className="h-sales-note">
            Days run midnight to midnight, India time. Cancelled orders are not counted.
          </p>
          <div className="h-kpis">
            <div className="is-hero">
              <p>Sales</p>
              <h2>{money(stats.sales)}</h2>
              <small>{plural(sold.length, "order")}</small>
            </div>
            <div>
              <p>Drinks</p>
              <h2>{stats.drinkUnits}</h2>
              <small>
                {stats.addonUnits} add-ons · {stats.hot} hot / {stats.iced} iced
              </small>
            </div>
            <div>
              <p>Average order</p>
              <h2>{money(sold.length ? Math.round(stats.sales / sold.length) : 0)}</h2>
              <small>
                {sold.length ? (stats.drinkUnits / sold.length).toFixed(1) : "0"} drinks each
              </small>
            </div>
            <div>
              <p>UPI</p>
              <h2>{money(stats.upi.reduce((n, o) => n + o.total, 0))}</h2>
              <small>{plural(stats.upi.length, "order")}</small>
            </div>
            <div>
              <p>Cash</p>
              <h2>{money(stats.cash.reduce((n, o) => n + o.total, 0))}</h2>
              <small>{plural(stats.cash.length, "order")}</small>
            </div>
          </div>
          <div className="h-panels">
            <section className="h-panel">
              <h3>Bestsellers</h3>
              {stats.top.length ? (
                <ol className="h-bars">
                  {stats.top.map(([name, v]) => (
                    <li key={name}>
                      <span>{name}</span>
                      <i style={{ width: `${(v.qty / maxTop) * 100}%` }} />
                      <b>{v.qty}</b>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="h-muted">No sales yet.</p>
              )}
              {stats.addonList.length > 0 && (
                <p className="h-addon-tally">
                  {stats.addonList.map(([n, v]) => `${n} ${v.qty}`).join(" · ")}
                </p>
              )}
            </section>
            <section className="h-panel">
              <h3>Orders by hour</h3>
              {stats.hours.length ? (
                <div className="h-hours">
                  {stats.hours.map(([h, v]) => (
                    <div key={h} title={`${v.orders} orders · ${money(v.sales)}`}>
                      <b>{v.orders}</b>
                      <i style={{ height: `${(v.orders / maxHour) * 100}%` }} />
                      <span>{((h + 11) % 12) + 1}{h < 12 ? "a" : "p"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="h-muted">No orders yet.</p>
              )}
              {stats.cats.length > 0 && (
                <p className="h-addon-tally">
                  {stats.cats.map(([c, n]) => `${c} ${n}`).join(" · ")}
                </p>
              )}
            </section>
          </div>
          <section className="h-panel">
            <h3>
              Order book <span>{inDay.length}</span>
            </h3>
            {cancelled.length > 0 && (
              <p className="h-muted">
                {cancelled.length} cancelled ({money(cancelled.reduce((n, o) => n + o.total, 0))}
                ) — check refunds separately.
              </p>
            )}
            <div className="h-table">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Time</th>
                    <th>Items</th>
                    <th>Pay</th>
                    <th>Total</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {inDay.map((o) => (
                    <tr key={o.id} className={o.status === "Cancelled" ? "is-cancelled" : ""}>
                      <td>{o.no}</td>
                      <td>
                        {new Date(o.created).toLocaleTimeString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </td>
                      <td>
                        {o.lines.map((l) => `${l.qty}× ${l.item.name}${l.option ? ` (${l.option})` : ""}`).join(", ")}
                        {o.status === "Cancelled" && <small>Cancelled: {o.cancellationReason}</small>}
                      </td>
                      <td>{o.payment}</td>
                      <td>{money(o.total)}</td>
                      <td>
                        <button
                          className="h-link"
                          disabled={hop.saving.has(o.id)}
                          onClick={() =>
                            o.status === "Cancelled"
                              ? void move(o, "Queued")
                              : (setCancelling(o), setReason(""))
                          }
                        >
                          {o.status === "Cancelled" ? "Restore" : "Cancel"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      )}

      {cancelling && (
        <div
          className="h-modal"
          onClick={() => !hop.saving.has(cancelling.id) && setCancelling(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="h-cancel-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.key === "Escape" && setCancelling(null)}
          >
            <h2 id="h-cancel-title">Cancel order #{cancelling.no}?</h2>
            <p>
              It leaves the board but stays in the order book. The {money(cancelling.total)}{" "}
              payment is not refunded by the app.
            </p>
            <div className="h-reasons">
              {["Wrong entry", "Customer left", "Duplicate", "Test"].map((r) => (
                <button key={r} className={reason === r ? "is-on" : ""} onClick={() => setReason(r)}>
                  {r}
                </button>
              ))}
            </div>
            <input
              autoFocus
              value={reason}
              maxLength={200}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Or type a reason"
              aria-label="Cancellation reason"
            />
            <div className="h-modal-actions">
              <button className="h-ghost" onClick={() => setCancelling(null)}>
                Keep it
              </button>
              <button
                className="h-danger"
                disabled={!reason.trim() || hop.saving.has(cancelling.id)}
                onClick={async () => {
                  const o = cancelling;
                  if (await hop.cancel(o, reason.trim())) {
                    setCancelling(null);
                    setToast(`#${o.no} cancelled`);
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
        <div className="h-toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}
