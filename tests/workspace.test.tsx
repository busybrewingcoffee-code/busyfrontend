// @vitest-environment jsdom
import { act, renderHook, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }));
vi.mock("../src/supabase", () => ({ supabase: mocks }));
import { useWorkspace, type Line } from "../src/useWorkspace";
const line: Line = {
  key: "0-Hot-None",
  item: {
    id: 0,
    name: "Americano",
    price: 149,
    category: "Classics",
    description: "",
    art: "americano",
  },
  qty: 1,
  option: "Hot",
  syrup: "None",
};
const order = {
  id: 1,
  version: 1,
  payment: "Cash",
  status: "Queued",
  created_at: new Date().toISOString(),
  note: "",
  order_items: [
    {
      id: 1,
      menu_item_id: 0,
      name: "Americano",
      quantity: 1,
      option: "Hot",
      addon: "None",
      unit_price_paise: 14900,
      addon_price_paise: 0,
    },
  ],
};
beforeEach(() => {
  localStorage.clear();
  mocks.rpc.mockReset();
  mocks.from.mockImplementation((table: string) => {
    const response = {
      data:
        table === "menu_items"
          ? [
              {
                id: 0,
                name: "Americano",
                category: "Classics",
                description: "",
                art: "americano",
                price_paise: 14900,
                options: ["Hot", "Iced"],
                syrup: true,
              },
            ]
          : table === "addons"
            ? [{ name: "None", price_paise: 0 }]
            : [structuredClone(order)],
      error: null,
    };
    const q: any = {
      select: () => q,
      eq: () => q,
      order: () => q,
      range: () => q,
      lte: () => q,
      then: (f: any) => Promise.resolve(response).then(f),
    };
    return q;
  });
});
afterEach(() => cleanup());
it("persists an uncertain checkout and retries the same request after remount", async () => {
  mocks.rpc
    .mockResolvedValueOnce({ data: null, error: { message: "Network error" } })
    .mockResolvedValueOnce({ data: 7, error: null });
  const first = renderHook(() => useWorkspace("staff"));
  await waitFor(() => expect(first.result.current.loading).toBe(false));
  await act(async () => {
    await first.result.current.checkout([line], "Cash", "");
  });
  const id = mocks.rpc.mock.calls[0][1].p_request_id;
  expect(first.result.current.pending?.id).toBe(id);
  first.unmount();
  const second = renderHook(() => useWorkspace("staff"));
  await waitFor(() => expect(second.result.current.loading).toBe(false));
  await act(async () => {
    expect(await second.result.current.checkout([], "UPI", "ignored")).toBe(7);
  });
  expect(mocks.rpc.mock.calls[1][1]).toEqual(mocks.rpc.mock.calls[0][1]);
  expect(second.result.current.pending).toBe(null);
});
it("sends the pickup version and restores the ticket after a conflict", async () => {
  mocks.rpc.mockResolvedValue({
    data: null,
    error: { code: "40001", message: "Order changed on another device" },
  });
  const h = renderHook(() => useWorkspace("staff"));
  await waitFor(() => expect(h.result.current.orders.length).toBe(1));
  await act(async () => {
    expect(await h.result.current.move(1, "Ready", 0)).toBe(false);
  });
  expect(mocks.rpc.mock.calls[0][1].p_expected_version).toBe(0);
  expect(h.result.current.orders[0].status).toBe("Queued");
  expect(h.result.current.saving.size).toBe(0);
  expect(h.result.current.error).toContain("another device");
});
it("blocks duplicate submissions while confirmation is in flight", async () => {
  let resolve!: (v: any) => void;
  mocks.rpc.mockReturnValue(new Promise((r) => (resolve = r)));
  const h = renderHook(() => useWorkspace("staff"));
  await waitFor(() => expect(h.result.current.loading).toBe(false));
  await act(async () => {
    const first = h.result.current.checkout([line], "Cash", "");
    expect(await h.result.current.checkout([line], "Cash", "")).toBe(null);
    resolve({ data: 8, error: null });
    await first;
  });
  expect(mocks.rpc).toHaveBeenCalledTimes(1);
});
it("unlocks a rejected order so its invalid details can be corrected", async () => {
  mocks.rpc.mockResolvedValue({
    error: { code: "P0001", message: "Item unavailable" },
    data: null,
  });
  const h = renderHook(() => useWorkspace("staff"));
  await waitFor(() => expect(h.result.current.loading).toBe(false));
  await act(async () => {
    await h.result.current.checkout([line], "Cash", "");
  });
  expect(h.result.current.pending).toBe(null);
  expect(h.result.current.error).toContain("Nothing was saved");
});
it("cancellation uses the displayed version and preserves data on conflict", async () => {
  mocks.rpc.mockResolvedValue({
    data: null,
    error: { code: "40001", message: "Order changed" },
  });
  const h = renderHook(() => useWorkspace("staff"));
  await waitFor(() => expect(h.result.current.orders.length).toBe(1));
  const snapshot = h.result.current.orders[0];
  await act(async () => {
    expect(
      await h.result.current.cancel(snapshot, "Customer changed their mind"),
    ).toBe(false);
  });
  expect(mocks.rpc.mock.calls[0][0]).toBe("cancel_order");
  expect(mocks.rpc.mock.calls[0][1].p_expected_version).toBe(1);
  expect(h.result.current.orders[0].status).toBe("Queued");
  expect(h.result.current.saving.size).toBe(0);
});
