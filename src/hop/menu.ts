export const EVENT = "hop";
export type Temperature = "Hot" | "Iced";
export type HopItem = {
  id: number;
  name: string;
  category: string;
  description: string;
  art: string;
  price: number;
  options: string[];
};
export const categories = [
  "All",
  "Standard",
  "Signature",
  "Seasonal",
  "Non-coffee",
  "Matcha",
  "Mocktails",
];
export const ADDONS = "Add-ons";
export const isAddon = (i: { category: string }) => i.category === ADDONS;
const TEMPS = ["Hot", "Iced"];
// Variant drinks (Regular/Diet Coke, Strawberry/Cranberry) are always served iced.
export const variants = (i: HopItem) =>
  i.options.filter((o) => o && !TEMPS.includes(o));
export const serves = (i: HopItem, t: Temperature) =>
  isAddon(i) || (variants(i).length ? t === "Iced" : i.options.includes(t));
export const optionFor = (i: HopItem, t: Temperature) =>
  isAddon(i) ? "" : i.options.includes(t) ? t : i.options[0];

// A selling day is a calendar day in India (midnight to midnight, IST).
export const istDay = (ms: number) =>
  new Date(ms).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
export const istHour = (ms: number) =>
  Number(
    new Date(ms).toLocaleString("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hour12: false,
    }),
  ) % 24;
export const dayLabel = (day: string) =>
  new Date(day + "T12:00:00+05:30").toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
  });

// crypto.randomUUID only exists on https/localhost; phones on plain http (LAN
// testing) don't have it. getRandomValues works everywhere. Same UUID v4 format.
export const uuid = (): string => {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};
