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
import React, { useState, useEffect, useRef } from "react";
import {
  useWorkspace,
  type Line,
  type Order,
  type Status,
} from "./useWorkspace";
import { supabase } from "./supabase";
import {
  Plus,
  Minus,
  X,
  Search,
  ArrowRight,
  Check,
  ShoppingBag,
  LayoutGrid,
  Columns3,
  ChartNoAxesCombined,
  RotateCcw,
  Banknote,
  Smartphone,
  Download,
  Coffee,
  Snowflake,
  GripVertical,
} from "lucide-react";
import {
  categories,
  syrups,
  servesTemperature,
  servingOption,
  hasTemperatureOptions,
  type Temperature,
  type Item,
} from "./menu";
import { Art } from "./Art";
import "./style.css";
const stages: Status[] = ["Queued", "Preparing", "Ready", "Collected"];
const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const price = (l: Line) =>
  l.item.price + (l.addonPrice ?? (l.syrup !== "None" ? 30 : 0));
const total = (ls: Line[]) => ls.reduce((n, l) => n + price(l) * l.qty, 0);
function TicketHeading({ o }: { o: Order }) {
  return (
    <>
      <span className="ticket-identity">
        <strong>#{o.id}</strong>
        <span className="ticket-age">
          {Math.max(0, Math.floor((Date.now() - o.created) / 60000))} min ago
        </span>
      </span>
      <GripVertical className="ticket-grip" size={20} />
    </>
  );
}
function TicketBody({
  o,
  move,
  handle,
  cancel,
}: {
  o: Order;
  move: (id: number, status: Status) => void;
  handle?: React.ReactNode;
  cancel?: (order: Order) => void;
}) {
  const idx = stages.indexOf(o.status);
  return (
    <>
      {handle || (
        <div className="ticket-top ticket-drag-header">
          <TicketHeading o={o} />
        </div>
      )}
      <ul>
        {o.lines.map((l) => (
          <li key={l.key}>
            <b>{l.qty}</b>
            <div>
              {l.item.name}
              <small>
                {[l.option, l.syrup !== "None" ? l.syrup : ""]
                  .filter(Boolean)
                  .join(" · ")}
              </small>
            </div>
          </li>
        ))}
      </ul>
      {o.note && <p className="ticket-note">{o.note}</p>}
      <div className="ticket-pay">
        <span>
          <Check size={13} />
          Paid · {o.payment}
        </span>
        <strong>{money(total(o.lines))}</strong>
      </div>
      {idx < 3 ? (
        <button className="advance" onClick={() => move(o.id, stages[idx + 1])}>
          {["Start preparing", "Mark ready", "Mark collected"][idx]}
          <ArrowRight size={15} />
        </button>
      ) : (
        <div className="collected">
          <Check size={15} />
          All served.
        </div>
      )}
      {cancel && (
        <button className="cancel-link" onClick={() => cancel(o)}>
          Cancel order
        </button>
      )}
      {idx > 0 && (
        <button className="undo" onClick={() => move(o.id, stages[idx - 1])}>
          <RotateCcw size={12} />
          Move back
        </button>
      )}
    </>
  );
}
function DragTicket({
  o,
  move,
  cancel,
}: {
  o: Order;
  move: (id: number, status: Status) => void;
  cancel: (order: Order) => void;
}) {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, isDragging } =
    useDraggable({ id: o.id });
  return (
    <article
      ref={setNodeRef}
      className={`ticket ${isDragging ? "drag-source" : ""}`}
      onMouseDown={(event) => {
        if (
          !(event.target as Element).closest(
            "button, a, input, select, textarea, [role='button']",
          )
        )
          listeners?.onMouseDown?.(event);
      }}
    >
      <TicketBody
        o={o}
        move={move}
        cancel={cancel}
        handle={
          <button
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            className="ticket-top ticket-drag-header"
            aria-label={`Move order ${o.id}`}
            title="Drag header to move · Space to pick up"
          >
            <TicketHeading o={o} />
          </button>
        }
      />
    </article>
  );
}
function BoardColumn({
  stage,
  idx,
  children,
}: {
  stage: Status;
  idx: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <section
      ref={setNodeRef}
      className={`column stage-${idx} ${isOver ? "drop-target" : ""}`}
    >
      {children}
    </section>
  );
}
export default function StaffApp({ userId }: { userId: string }) {
  const workspace = useWorkspace(userId);
  const { menu, orders } = workspace;
  const [cancelling, setCancelling] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const salesOrders = orders.filter((o) => o.status !== "Cancelled");
  const requestCancel = (o: Order) => {
    setCancelling(o);
    setCancelReason("");
  };
  const dragVersion = useRef<number | undefined>(undefined);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor),
  );
  const [tab, setTab] = useState("Counter"),
    [category, setCategory] = useState("All"),
    [temperature, setTemperature] = useState<Temperature>("Cold"),
    [search, setSearch] = useState(""),
    [basket, setBasket] = useState<Line[]>(() => {
      try {
        return JSON.parse(localStorage.getItem("bb-draft-" + userId) || "[]");
      } catch {
        return [];
      }
    }),
    [selected, setSelected] = useState<Item | null>(null),
    [option, setOption] = useState(""),
    [syrup, setSyrup] = useState("None"),
    [payment, setPayment] = useState<"UPI" | "Cash">("UPI"),
    [note, setNote] = useState(""),
    [toast, setToast] = useState(""),
    [dragging, setDragging] = useState<number | null>(null),
    [mobileCart, setMobileCart] = useState(false);
  const [, tick] = useState(0);
  useEffect(() => {
    try {
      localStorage.setItem("bb-draft-" + userId, JSON.stringify(basket));
    } catch {
      /* Checkout explicitly checks durable storage before submitting. */
    }
  }, [basket, userId]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelected(null);
        setMobileCart(false);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);
  const add = (item: Item, opt = "", syr = "None") => {
    const key = `${item.id}-${opt}-${syr}`;
    setBasket((b) => {
      const old = b.find((l) => l.key === key);
      return old
        ? b.map((l) =>
            l.key === key ? { ...l, qty: Math.min(99, l.qty + 1) } : l,
          )
        : [
            ...b,
            {
              key,
              item,
              qty: 1,
              option: opt,
              syrup: syr,
              addonPrice: workspace.addonPrices[syr] ?? 0,
            },
          ];
    });
    setSelected(null);
    setToast(`${item.name} added`);
  };
  const customize = (item: Item) => {
    setSelected(item);
    setOption(
      hasTemperatureOptions(item) || !item.options
        ? servingOption(item, temperature)
        : item.options[0],
    );
    setSyrup("None");
  };
  const choose = (item: Item) => {
    if (item.options && !hasTemperatureOptions(item)) customize(item);
    else add(item, servingOption(item, temperature));
  };
  const change = (key: string, n: number) =>
    setBasket((b) =>
      b
        .map((l) =>
          l.key === key ? { ...l, qty: Math.min(99, l.qty + n) } : l,
        )
        .filter((l) => l.qty > 0),
    );
  const checkout = async () => {
    const id = await workspace.checkout(basket, payment, note);
    if (id !== null) {
      setBasket([]);
      setNote("");
      setMobileCart(false);
      setToast(`Order #${id} is on the board`);
    }
  };
  const move = async (id: number, status: Status, version?: number) => {
    if (await workspace.move(id, status, version))
      setToast(`#${id} → ${status}`);
  };
  const visible = menu.filter(
    (i) =>
      servesTemperature(i, temperature) &&
      (category === "All" || i.category === category) &&
      `${i.name} ${i.description}`.toLowerCase().includes(search.toLowerCase()),
  );
  const units = basket.reduce((n, l) => n + l.qty, 0);
  const active = salesOrders.filter((o) => o.status !== "Collected").length;
  const exportSales = () => {
    const rows = [
      ["Order", "Status", "Payment", "Total INR"],
      ...orders.map((o) => [o.id, o.status, o.payment, total(o.lines)]),
    ];
    const url = URL.createObjectURL(
      new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "busy-brewing-sales.csv";
    a.click();
    URL.revokeObjectURL(url);
    setToast("Sales exported");
  };
  return (
    <>
      <header>
        <a className="brand" href="/staff" aria-label="Busy Brewing home">
          <svg
            className="brand-mark"
            viewBox="350 120 570 855"
            aria-hidden="true"
          >
            <image href="/brand.jpg" width="1254" height="1254" />
          </svg>
          <span>
            BUSY
            <br />
            BREWING<small>THE STALL WORKSPACE</small>
          </span>
        </a>
        <nav aria-label="Workspace">
          {[
            ["Counter", LayoutGrid],
            ["Orders", Columns3],
            ["Summary", ChartNoAxesCombined],
          ].map(([name, Icon]) => (
            <button
              aria-label={String(name)}
              key={String(name)}
              className={tab === name ? "active" : ""}
              onClick={() => setTab(String(name))}
            >
              {React.createElement(Icon as typeof LayoutGrid, { size: 18 })}
              <span>{String(name)}</span>
              {name === "Orders" && <b>{active}</b>}
            </button>
          ))}
        </nav>
        <div className="session">
          <span className="live-dot" />
          Pujo pop-up<small>GK II, New Delhi</small>
        </div>
      </header>
      <div className="demo-bar sync-bar">
        <span>
          {workspace.loading
            ? "CONNECTING"
            : workspace.synced
              ? "CONNECTED"
              : "OFFLINE"}
        </span>
        Shared workspace · refreshes every 5 seconds
        <button onClick={() => supabase!.auth.signOut()}>Sign out</button>
      </div>
      {workspace.error && (
        <div className="workspace-error" role="alert">
          {workspace.error}
          <button onClick={() => workspace.refresh()}>Refresh</button>
        </div>
      )}
      {workspace.pending && (
        <div className="workspace-error" role="status">
          An order confirmation needs checking. It will not be submitted twice.
          <button disabled={workspace.submitting} onClick={checkout}>
            {workspace.submitting ? "Checking…" : "Retry confirmation"}
          </button>
        </div>
      )}
      {tab === "Counter" ? (
        <main
          className={`counter ${workspace.pending || workspace.submitting ? "checkout-lock" : ""}`}
        >
          <section className="catalog">
            <div className="page-heading">
              <div>
                <p className="eyebrow">A LITTLE BUSY. ALWAYS BREWING.</p>
                <h1>Good things, on repeat.</h1>
              </div>
              <span className="menu-count">{menu.length} things to love</span>
            </div>
            <div className="search">
              <Search size={18} />
              <input
                aria-label="Search menu"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find a drink or a little something to eat…"
              />
              {search && (
                <button aria-label="Clear search" onClick={() => setSearch("")}>
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="menu-controls">
              <div className="categories" aria-label="Menu categories">
                {categories.map((c) => (
                  <button
                    key={c}
                    aria-pressed={c === category}
                    className={c === category ? "selected" : ""}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="temperature-toolbar">
                <div
                  className="temperature-toggle"
                  role="group"
                  aria-label="Drink temperature"
                >
                  <span
                    className={`temperature-thumb ${temperature === "Cold" ? "cold" : ""}`}
                  />
                  {(["Hot", "Cold"] as const).map((value) => (
                    <button
                      key={value}
                      aria-label={`${value} drinks`}
                      title={`${value} drinks`}
                      aria-pressed={temperature === value}
                      onClick={() => setTemperature(value)}
                    >
                      {value === "Hot" ? (
                        <Coffee size={22} />
                      ) : (
                        <Snowflake size={22} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="section-label">
              <h2>{category === "All" ? "The whole menu" : category}</h2>
              <span>{visible.length} items</span>
            </div>
            <div className="menu-grid">
              {visible.map((i) => (
                <div className="menu-entry" key={i.id}>
                  <button
                    className="menu-item"
                    onClick={() => choose(i)}
                    aria-label={`Add ${i.name}, ${money(i.price)}`}
                  >
                    <div
                      className={`illustration ${i.category === "Pujo specials" ? "special" : ""}`}
                    >
                      <Art
                        kind={i.art}
                        option={servingOption(i, temperature)}
                      />
                      {i.category === "Pujo specials" && (
                        <span className="special-tag">PUJO PICK</span>
                      )}
                      <span className="add-mark">
                        <Plus size={17} />
                      </span>
                    </div>
                    <div className="item-copy">
                      <span className="item-category">{i.category}</span>
                      <h3>{i.name}</h3>
                      <div>
                        <strong>{money(i.price)}</strong>
                        <span>
                          {hasTemperatureOptions(i)
                            ? servingOption(i, temperature)
                            : i.options?.join(" / ") || " "}
                        </span>
                      </div>
                    </div>
                  </button>
                  {i.syrup && (
                    <button
                      className="customize-item"
                      aria-label={`Add syrup to ${i.name}`}
                      onClick={() => customize(i)}
                    >
                      Add syrup <Plus size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {!visible.length && (
              <div className="empty">
                <Search />
                <h3>No matches on the menu</h3>
                <p>Try another category, search, or temperature.</p>
                <button
                  onClick={() => {
                    setSearch("");
                    setCategory("All");
                  }}
                >
                  Show all items
                </button>
              </div>
            )}
            <footer>
              Made for good coffee & a happy little rush.
              <span>BUSY BREWING</span>
            </footer>
          </section>
          <aside className={`basket ${mobileCart ? "mobile-open" : ""}`}>
            <div className="basket-head">
              <div>
                <p className="eyebrow">AT THE COUNTER</p>
                <h2>
                  New order <span>{units || "–"}</span>
                </h2>
              </div>
              <button
                className="mobile-close"
                onClick={() => setMobileCart(false)}
                aria-label="Close basket"
              >
                <X />
              </button>
              <ShoppingBag className="bag-icon" size={24} />
            </div>
            {basket.length ? (
              <div className="basket-lines">
                {basket.map((l) => (
                  <div className="basket-line" key={l.key}>
                    <div className="mini-art">
                      <Art
                        kind={
                          menu.find((i) => i.id === l.item.id)?.art ||
                          l.item.art
                        }
                        option={l.option}
                      />
                    </div>
                    <div className="line-copy">
                      <h3>{l.item.name}</h3>
                      <p>
                        {[l.option, l.syrup !== "None" ? l.syrup : ""]
                          .filter(Boolean)
                          .join(" · ") || l.item.category}
                      </p>
                      <div className="line-bottom">
                        <div className="quantity">
                          <button
                            aria-label={`Remove one ${l.item.name}`}
                            onClick={() => change(l.key, -1)}
                          >
                            <Minus size={13} />
                          </button>
                          <span>{l.qty}</span>
                          <button
                            aria-label={`Add one ${l.item.name}`}
                            onClick={() => change(l.key, 1)}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <strong>{money(price(l) * l.qty)}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-basket">
                <Art kind="cup" />
                <h3>What are we brewing?</h3>
                <p>
                  Tap something delicious
                  <br />
                  to start an order.
                </p>
              </div>
            )}
            <div className="basket-bottom">
              <label className="note-label">
                A little note <span>optional</span>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Less ice, extra napkins…"
                  maxLength={200}
                />
              </label>
              <div className="total">
                <span>Total</span>
                <strong>{money(total(basket))}</strong>
              </div>
              <div className="payment" aria-label="Payment method">
                {(["UPI", "Cash"] as const).map((p) => (
                  <button
                    aria-pressed={payment === p}
                    className={payment === p ? "chosen" : ""}
                    key={p}
                    onClick={() => setPayment(p)}
                  >
                    {p === "UPI" ? (
                      <Smartphone size={17} />
                    ) : (
                      <Banknote size={19} />
                    )}{" "}
                    {p}
                    {payment === p && <Check size={14} />}
                  </button>
                ))}
              </div>
              <button
                className="primary checkout"
                disabled={
                  !basket.length ||
                  workspace.submitting ||
                  workspace.loading ||
                  !workspace.synced
                }
                onClick={checkout}
              >
                <span>
                  {workspace.submitting
                    ? "Saving order…"
                    : `Confirm ${payment} received`}
                </span>
                <ArrowRight size={19} />
              </button>
              <p className="payment-hint">
                Record payment after checking cash or UPI receipt
              </p>
            </div>
          </aside>
          <button
            className="mobile-basket primary"
            onClick={() => setMobileCart(true)}
          >
            <ShoppingBag size={18} />
            View order · {units}
            <strong>{money(total(basket))}</strong>
          </button>
        </main>
      ) : tab === "Orders" ? (
        <main className="board-page">
          <div className="page-heading">
            <div>
              <p className="eyebrow">ONE ORDER AT A TIME</p>
              <h1>A little organised chaos.</h1>
            </div>
            <button className="primary" onClick={() => setTab("Counter")}>
              <Plus size={18} />
              New order
            </button>
          </div>
          <div className="board-meta">
            <span>
              <span className="live-dot" />
              {active} orders in the works
            </span>
            <span>Tap to update · drag the ticket header to move</span>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={(args) =>
              args.pointerCoordinates
                ? pointerWithin(args)
                : rectIntersection(args)
            }
            onDragStart={({ active }) => {
              dragVersion.current = orders.find(
                (o) => o.id === Number(active.id),
              )?.version;
              setDragging(Number(active.id));
            }}
            onDragCancel={() => setDragging(null)}
            onDragEnd={({ active, over }) => {
              if (
                over &&
                stages.includes(over.id as Status) &&
                orders.some(
                  (o) => o.id === Number(active.id) && o.status !== over.id,
                )
              )
                move(Number(active.id), over.id as Status, dragVersion.current);
              setDragging(null);
            }}
            accessibility={{
              screenReaderInstructions: {
                draggable:
                  "Press Space to pick up an order. Use arrow keys to move, Space to drop, or Escape to cancel. Status buttons also move an order.",
              },
            }}
          >
            <div className={`board ${dragging !== null ? "is-dragging" : ""}`}>
              {stages.map((stage, idx) => (
                <BoardColumn stage={stage} idx={idx} key={stage}>
                  <div className="column-head">
                    <h2>
                      <i />
                      {stage}
                    </h2>
                    <span>
                      {orders.filter((o) => o.status === stage).length}
                    </span>
                  </div>
                  <div className="tickets">
                    {orders
                      .filter((o) => o.status === stage)
                      .map((o) => (
                        <div
                          key={o.id}
                          className={
                            workspace.saving.has(o.id) ? "is-saving" : ""
                          }
                          aria-busy={workspace.saving.has(o.id)}
                        >
                          <DragTicket
                            o={o}
                            move={move}
                            cancel={requestCancel}
                          />
                        </div>
                      ))}
                    {!orders.some((o) => o.status === stage) && (
                      <div className="column-empty">
                        <Coffee size={25} />
                        <p>
                          {idx === 0
                            ? "A moment to catch your breath."
                            : "Orders will find their way here."}
                        </p>
                      </div>
                    )}
                  </div>
                </BoardColumn>
              ))}
            </div>
            <DragOverlay dropAnimation={null}>
              {dragging !== null && orders.find((o) => o.id === dragging) ? (
                <article className="ticket ticket-overlay">
                  <TicketBody
                    o={orders.find((o) => o.id === dragging)!}
                    move={() => {}}
                  />
                </article>
              ) : null}
            </DragOverlay>
          </DndContext>
        </main>
      ) : (
        <main className="summary">
          <div className="page-heading">
            <div>
              <p className="eyebrow">THE EVENT, SO FAR</p>
              <h1>Every little cup counts.</h1>
            </div>
            <button className="secondary" onClick={exportSales}>
              <Download size={17} />
              Export sales
            </button>
          </div>
          <div className="summary-strip">
            <div>
              <p>Total sales</p>
              <h2>
                {money(salesOrders.reduce((n, o) => n + total(o.lines), 0))}
              </h2>
              <small>Excludes cancelled orders</small>
            </div>
            <div>
              <p>Orders</p>
              <h2>{orders.length}</h2>
              <small>
                {orders.filter((o) => o.status === "Collected").length}{" "}
                collected
              </small>
            </div>
            {(["UPI", "Cash"] as const).map((p) => (
              <div key={p}>
                <p>{p}</p>
                <h2>
                  {money(
                    salesOrders
                      .filter((o) => o.payment === p)
                      .reduce((n, o) => n + total(o.lines), 0),
                  )}
                </h2>
                <small>
                  {salesOrders.filter((o) => o.payment === p).length} orders
                </small>
              </div>
            ))}
          </div>
          {orders.some((o) => o.status === "Cancelled") && (
            <p className="cancelled-summary">
              {orders.filter((o) => o.status === "Cancelled").length} cancelled
              ·{" "}
              {money(
                orders
                  .filter((o) => o.status === "Cancelled")
                  .reduce((n, o) => n + total(o.lines), 0),
              )}{" "}
              originally recorded as paid. Check any cash or UPI refunds
              separately.
            </p>
          )}
          <h2 className="ledger-title">The order book</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className={o.status === "Cancelled" ? "cancelled-row" : ""}
                  >
                    <td>#{o.id}</td>
                    <td>
                      {o.lines
                        .map((l) => `${l.qty} × ${l.item.name}`)
                        .join(", ")}
                    </td>
                    <td>{o.payment}</td>
                    <td>
                      <span className="status-label">{o.status}</span>
                      {o.status === "Cancelled" && (
                        <small>{o.cancellationReason}</small>
                      )}
                    </td>
                    <td>{money(total(o.lines))}</td>
                    <td>
                      {o.status === "Cancelled" ? (
                        <button
                          className="cancel-link"
                          disabled={workspace.saving.has(o.id)}
                          onClick={() => move(o.id, "Queued")}
                        >
                          Restore to queue
                        </button>
                      ) : (
                        <button
                          className="cancel-link"
                          disabled={workspace.saving.has(o.id)}
                          onClick={() => requestCancel(o)}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      )}
      {cancelling && (
        <div className="modal-backdrop">
          <section
            className="customize cancel-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-title"
            onKeyDown={(e) => {
              if (e.key === "Escape" && !workspace.saving.has(cancelling.id))
                setCancelling(null);
              if (e.key === "Tab") {
                const els = e.currentTarget.querySelectorAll<HTMLElement>(
                  "input,button:not(:disabled)",
                );
                const first = els[0],
                  last = els[els.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first.focus();
                }
              }
            }}
          >
            <p className="eyebrow">ORDER #{cancelling.id}</p>
            <h2 id="cancel-title">Cancel this order?</h2>
            <p>
              It will leave the board and stay in your order history. This does
              not refund the {money(total(cancelling.lines))} payment.
            </p>
            <label>
              Reason
              <input
                autoFocus
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                maxLength={200}
                placeholder="Customer changed their mind…"
              />
            </label>
            <div className="cancel-actions">
              <button
                className="secondary"
                disabled={workspace.saving.has(cancelling.id)}
                onClick={() => setCancelling(null)}
              >
                Keep order
              </button>
              <button
                className="primary"
                disabled={
                  !cancelReason.trim() || workspace.saving.has(cancelling.id)
                }
                onClick={async () => {
                  if (await workspace.cancel(cancelling, cancelReason)) {
                    setToast(`Order #${cancelling.id} cancelled`);
                    setCancelling(null);
                  }
                }}
              >
                {workspace.saving.has(cancelling.id)
                  ? "Cancelling…"
                  : "Cancel order"}
              </button>
            </div>
            {workspace.error && <p role="alert">{workspace.error}</p>}
          </section>
        </div>
      )}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <section
            className="customize"
            role="dialog"
            aria-modal="true"
            aria-labelledby="custom-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                const els =
                  e.currentTarget.querySelectorAll<HTMLButtonElement>("button");
                const first = els[0],
                  last = els[els.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first.focus();
                }
              }
            }}
          >
            <button
              autoFocus
              className="dialog-close"
              aria-label="Close options"
              onClick={() => setSelected(null)}
            >
              <X size={22} />
            </button>
            <div className="custom-art">
              <Art kind={selected.art} option={option} />
            </div>
            <p className="eyebrow">{selected.category}</p>
            <h2 id="custom-title">{selected.name}</h2>
            <p className="description">{selected.description}</p>
            {selected.options && (
              <fieldset>
                <legend>Make it yours</legend>
                <div className="option-row">
                  {selected.options.map((o) => (
                    <button
                      key={o}
                      aria-pressed={o === option}
                      className={o === option ? "selected" : ""}
                      onClick={() => setOption(o)}
                    >
                      {o}
                      {o === option && <Check size={15} />}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
            {selected.syrup && (
              <fieldset>
                <legend>A little extra</legend>
                <div className="syrups">
                  {syrups
                    .filter((s) => s in workspace.addonPrices)
                    .map((s) => (
                      <button
                        key={s}
                        aria-pressed={s === syrup}
                        className={s === syrup ? "selected" : ""}
                        onClick={() => setSyrup(s)}
                      >
                        {s}
                        {s !== "None" &&
                          ` + ${money(workspace.addonPrices[s] ?? 0)}`}
                      </button>
                    ))}
                </div>
              </fieldset>
            )}
            <button
              className="primary add-to-order"
              onClick={() => add(selected, option, syrup)}
            >
              Add to order{" "}
              <span>
                {money(selected.price + (workspace.addonPrices[syrup] ?? 0))}
                <Plus size={18} />
              </span>
            </button>
          </section>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
    </>
  );
}
