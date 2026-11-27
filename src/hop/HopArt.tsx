import { useId } from "react";

// Same drawing language as the Pujo counter (src/Art.tsx): flat fills, one warm
// outline colour, muted tones. Iced = takeaway cup, Hot = glass mug, so every
// drink shows its real layers, foam and garnish.
const INK = "#773b39";
const K = {
  espresso: "#4d302d",
  coldbrew: "#5a3a2f",
  coffee: "#714839",
  latte: "#c69871",
  milk: "#f5e7cf",
  condensed: "#ead3a5",
  choc: "#6b4232",
  chocMilk: "#94654d",
  foam: "#f6e9d4",
  matcha: "#8f9f62",
  strawberry: "#ce8385",
  cherry: "#9c3a4a",
  cranberry: "#a84a5c",
  orange: "#dfaa5e",
  cola: "#4a2c26",
  pom: "#b4475a",
  lime: "#dfe3b6",
  apple: "#b3bf74",
  caramel: "#bc874e",
  maple: "#b07443",
  biscoff: "#b77a45",
  cinnamon: "#8a5133",
  cocoa: "#5a3528",
};
type Garnish =
  | "cocoa"
  | "cinnamon"
  | "popcorn"
  | "biscuit"
  | "salt"
  | "cherry"
  | "lime"
  | "mint"
  | "pom"
  | "strawberry"
  | "berries";
type Spec = {
  layers: [string, number][]; // bottom → top, fractions of the liquid
  foam?: string;
  foamH?: number;
  drizzle?: string;
  top?: Garnish[];
  fizz?: boolean;
  straw?: boolean;
  bottle?: string; // add-on syrup bottle colour
  shot?: boolean;
};
const S: Record<string, Spec> = {
  americano: { layers: [[K.coldbrew, 1]] },
  "og-cold": {
    layers: [[K.latte, 1]],
    foam: "#efdfc6",
    foamH: 9,
    drizzle: K.choc,
    straw: true,
  },
  cappuccino: {
    layers: [
      [K.coffee, 0.5],
      [K.latte, 0.5],
    ],
    foam: K.foam,
    foamH: 16,
    top: ["cocoa"],
  },
  mocha: {
    layers: [
      [K.choc, 0.35],
      [K.coffee, 0.65],
    ],
    foam: K.foam,
    drizzle: K.choc,
    top: ["cocoa"],
  },
  "flat-white": { layers: [[K.latte, 1]], foam: "#eedcc0", foamH: 6 },
  "fridge-cigarette": {
    layers: [
      [K.cola, 0.7],
      [K.espresso, 0.3],
    ],
    foam: K.foam,
    foamH: 14,
    fizz: true,
    straw: true,
  },
  tiramisu: {
    layers: [
      [K.milk, 0.45],
      [K.coffee, 0.55],
    ],
    foam: K.foam,
    top: ["cocoa", "biscuit"],
  },
  "mont-blanc": {
    layers: [
      [K.orange, 0.5],
      [K.coldbrew, 0.5],
    ],
    foam: K.foam,
    foamH: 13,
  },
  popcorn: {
    layers: [[K.latte, 1]],
    foam: K.foam,
    drizzle: K.caramel,
    top: ["popcorn"],
  },
  spanish: {
    layers: [
      [K.condensed, 0.3],
      [K.latte, 0.7],
    ],
  },
  "cinnamon-latte": {
    layers: [[K.latte, 1]],
    foam: K.foam,
    drizzle: K.caramel,
    top: ["cinnamon"],
  },
  "biscoff-latte": {
    layers: [[K.latte, 1]],
    foam: "#e7c79d",
    drizzle: K.biscoff,
    top: ["biscuit"],
  },
  "maple-latte": {
    layers: [[K.latte, 1]],
    foam: K.foam,
    drizzle: K.maple,
    top: ["salt"],
  },
  "sea-salt-mocha": {
    layers: [
      [K.choc, 0.45],
      [K.coffee, 0.55],
    ],
    foam: K.foam,
    top: ["salt"],
  },
  "cherry-mont-blanc": {
    layers: [
      [K.cherry, 0.35],
      [K.coldbrew, 0.65],
    ],
    foam: K.foam,
    top: ["cherry"],
  },
  "espresso-fizz": {
    layers: [
      [K.strawberry, 0.65],
      [K.espresso, 0.35],
    ],
    fizz: true,
    straw: true,
  },
  "hot-chocolate": {
    layers: [[K.choc, 1]],
    foam: "#f6e9dc",
    foamH: 10,
    top: ["cocoa"],
  },
  "cherry-cloud": {
    layers: [[K.chocMilk, 1]],
    foam: "#f4c6cf",
    top: ["cherry"],
  },
  "cranberry-cloud": {
    layers: [
      [K.cranberry, 0.3],
      [K.chocMilk, 0.7],
    ],
    foam: "#f4c6cf",
    top: ["berries"],
  },
  "strawberry-cloud": {
    layers: [
      [K.strawberry, 0.4],
      [K.milk, 0.6],
    ],
    foam: "#7a4430",
    top: ["strawberry"],
  },
  matcha: {
    layers: [
      [K.milk, 0.5],
      [K.matcha, 0.5],
    ],
  },
  "biscoff-matcha": {
    layers: [
      [K.milk, 0.4],
      [K.matcha, 0.6],
    ],
    foam: "#e7c79d",
    drizzle: K.caramel,
    top: ["biscuit"],
  },
  "strawberry-matcha": {
    layers: [
      [K.strawberry, 0.3],
      [K.milk, 0.3],
      [K.matcha, 0.4],
    ],
  },
  "maple-matcha": {
    layers: [
      [K.maple, 0.18],
      [K.milk, 0.32],
      [K.matcha, 0.5],
    ],
    top: ["salt"],
  },
  "cinnamon-matcha": {
    layers: [
      [K.milk, 0.45],
      [K.matcha, 0.55],
    ],
    foam: K.foam,
    top: ["cinnamon"],
  },
  "orange-sunset": {
    layers: [
      [K.cranberry, 0.4],
      [K.orange, 0.6],
    ],
    top: ["lime"],
    straw: true,
  },
  "merry-mojito": {
    layers: [[K.pom, 1]],
    fizz: true,
    top: ["mint", "pom", "lime"],
    straw: true,
  },
  "virgin-mojito": {
    layers: [[K.lime, 1]],
    fizz: true,
    top: ["mint", "lime"],
    straw: true,
  },
  grinch: {
    layers: [[K.apple, 1]],
    fizz: true,
    top: ["mint", "lime"],
    straw: true,
  },
  "strawberry-lemonade": {
    layers: [[K.strawberry, 1]],
    fizz: true,
    top: ["strawberry", "mint"],
    straw: true,
  },
  "masala-coke": {
    layers: [[K.cola, 1]],
    fizz: true,
    top: ["lime", "mint"],
    straw: true,
  },
  "addon-hazelnut": { layers: [], bottle: "#8a5a36" },
  "addon-tiramisu": { layers: [], bottle: "#5e3a28" },
  "addon-caramel": { layers: [], bottle: K.caramel },
  "addon-popcorn": { layers: [], bottle: "#e9c25e" },
  "addon-vanilla": { layers: [], bottle: "#efdcae" },
  "addon-maple": { layers: [], bottle: K.maple },
  "addon-shot": { layers: [], shot: true },
};

// Their real logo (public/brand.jpg). The crop keeps just the "B" monogram;
// brand-logo.png is the same file with the paper made transparent.
const MARK = { x: 350, y: 120, w: 570, h: 855 };
const FULL = { x: 330, y: 110, w: 600, h: 1040 };
export function Logo({ full, className }: { full?: boolean; className?: string }) {
  const v = full ? FULL : MARK;
  return (
    <svg className={className} viewBox={`${v.x} ${v.y} ${v.w} ${v.h}`} role="img" aria-label="Busy Brewing">
      <image href="/brand-logo.png" width={1254} height={1254} />
    </svg>
  );
}

// Small deterministic jitter so dust/salt look natural but never "flicker".
const dots = (n: number, seed: number) =>
  Array.from({ length: n }, (_, i) => {
    const a = Math.sin(seed * 9.3 + i * 12.9898) * 43758.5453;
    const b = Math.sin(seed * 3.1 + i * 78.233) * 12345.678;
    return [a - Math.floor(a), b - Math.floor(b)];
  });

function Garnishes({ kinds, cx, y, w }: { kinds: Garnish[]; cx: number; y: number; w: number }) {
  return (
    <g>
      {kinds.map((k, gi) => {
        if (k === "cocoa" || k === "cinnamon" || k === "salt")
          return (
            <g key={k} stroke="none">
              {dots(k === "salt" ? 8 : 16, gi + 1).map(([a, b], i) => (
                <circle
                  key={i}
                  cx={cx - w / 2 + 8 + a * (w - 16)}
                  cy={y - 2 + b * 4}
                  r={k === "salt" ? 1.3 : 1}
                  fill={k === "cocoa" ? K.cocoa : k === "cinnamon" ? K.cinnamon : "#fffaf2"}
                  stroke={k === "salt" ? "#c9b49f" : "none"}
                  strokeWidth={0.5}
                />
              ))}
            </g>
          );
        if (k === "popcorn")
          return (
            <g key={k} fill="#f5e4c3">
              {[[-9, -3], [1, -6], [10, -2]].map(([dx, dy], i) => (
                <path
                  key={i}
                  transform={`translate(${cx + dx} ${y + dy})`}
                  d="M-4 1q-3-5 2-6 1-4 5-2 5-1 4 4 3 4-2 6-2 3-5 1-5 1-4-3Z"
                />
              ))}
            </g>
          );
        if (k === "biscuit")
          return (
            <g key={k} transform={`translate(${cx + 7} ${y - 10}) rotate(14)`}>
              <rect x={-8} y={-6} width={16} height={12} rx={2} fill={K.biscoff} />
              <path d="M-4 -2h0M0 -2h0M4 -2h0M-4 2h0M0 2h0M4 2h0" strokeWidth={1.6} />
            </g>
          );
        if (k === "cherry")
          return (
            <g key={k} transform={`translate(${cx + 2} ${y - 5})`}>
              <path d="M0 -4q3-7 9-10" fill="none" />
              <circle r={4.6} fill={K.cherry} />
            </g>
          );
        if (k === "berries" || k === "pom")
          return (
            <g key={k}>
              {dots(k === "pom" ? 6 : 4, gi + 4).map(([a, b], i) => (
                <circle
                  key={i}
                  cx={cx - w / 2 + 12 + a * (w - 24)}
                  cy={y - 2 + b * 3}
                  r={k === "pom" ? 1.8 : 2.6}
                  fill={k === "pom" ? K.pom : K.cranberry}
                  strokeWidth={0.8}
                />
              ))}
            </g>
          );
        if (k === "strawberry")
          return (
            <g key={k} transform={`translate(${cx - 9} ${y - 6}) rotate(-18)`}>
              <path d="M0 -7c6 0 8 5 0 14-8-9-6-14 0-14Z" fill={K.strawberry} />
              <path d="M-3 -7l3-3 3 3" fill="none" stroke="#7b8f5c" />
            </g>
          );
        if (k === "mint")
          return (
            <path
              key={k}
              d={`M${cx - 6} ${y - 1}q-8-14 5-15 4 10-5 15m1-2q9-15 16-8-4 9-16 8`}
              fill="#8c9f70"
              stroke="#718456"
            />
          );
        if (k === "lime")
          return (
            <g key={k} transform={`translate(${cx + w / 2 - 7} ${y - 2})`}>
              <circle r={8.5} fill="#a9b86a" />
              <circle r={6.6} fill="#eef0cc" stroke="none" />
              <path d="M0 -6.6V6.6M-6.6 0H6.6M-4.7 -4.7l9.4 9.4M4.7 -4.7l-9.4 9.4" stroke="#cdd49c" strokeWidth={0.8} />
            </g>
          );
        return null;
      })}
    </g>
  );
}

function Bottle({ color, label }: { color: string; label: string }) {
  return (
    <svg viewBox="0 0 120 140" className="hop-art" aria-hidden="true" fill="none" stroke={INK} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
      <ellipse cx={60} cy={130} rx={28} ry={4} fill="#e6d6c3" stroke="none" />
      <rect x={52} y={14} width={16} height={9} rx={2} fill="#9a7b6e" />
      <path d="M54 23h12v9c0 5 13 8 13 20v65a9 9 0 0 1-9 9H50a9 9 0 0 1-9-9V52c0-12 13-15 13-20Z" fill={color} />
      <rect x={45} y={66} width={30} height={30} rx={3} fill="#f8ecd8" />
      <text x={60} y={84} textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize={6} fontWeight={600} letterSpacing={0.5} fill={INK} stroke="none">
        {label}
      </text>
    </svg>
  );
}

function Shot() {
  return (
    <svg viewBox="0 0 120 140" className="hop-art" aria-hidden="true" fill="none" stroke={INK} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
      <ellipse cx={60} cy={130} rx={26} ry={4} fill="#e6d6c3" stroke="none" />
      <path d="M38 58h44l-5 68a4 4 0 0 1-4 4H47a4 4 0 0 1-4-4Z" fill="#f8ecd8" />
      <path d="M41 76h38l-3.6 50H44.6Z" fill={K.espresso} stroke="none" />
      <path d="M41 76h38l-.5 7H41.5Z" fill="#c89a6a" stroke="none" />
      <path d="M38 58h44l-5 68a4 4 0 0 1-4 4H47a4 4 0 0 1-4-4Z" />
      <path className="hop-steam" d="M54 46c-5-6 4-9 0-16M66 46c-5-6 4-9 0-16" opacity={0.4} />
    </svg>
  );
}

const ADDON_LABEL: Record<string, string> = {
  "addon-hazelnut": "HAZELNUT",
  "addon-tiramisu": "TIRAMISU",
  "addon-caramel": "CARAMEL",
  "addon-popcorn": "POPCORN",
  "addon-vanilla": "VANILLA",
  "addon-maple": "MAPLE",
};

export function HopArt({ kind, option }: { kind: string; option?: string }) {
  const uid = useId().replace(/:/g, "");
  const spec = S[kind] ?? S.americano;
  if (spec.bottle) return <Bottle color={spec.bottle} label={ADDON_LABEL[kind] ?? ""} />;
  if (spec.shot) return <Shot />;
  const hot = option === "Hot";
  let layers = spec.layers;
  if (kind === "espresso-fizz" && option === "Cranberry")
    layers = [
      [K.cranberry, 0.65],
      [K.espresso, 0.35],
    ];
  if (hot && kind === "americano") layers = [[K.espresso, 1]];
  if (hot && kind.includes("matcha")) layers = [[K.matcha, 1]]; // hot matcha is whisked, not layered

  // Iced = tapered takeaway cup; hot = straight glass mug with a handle.
  const top = hot ? 50 : 26,
    bottom = hot ? 126 : 128,
    fill = hot ? 60 : 40;
  const halfTop = hot ? 29 : 36,
    halfBottom = hot ? 29 : 26,
    cx = hot ? 54 : 60;
  const xAt = (y: number, side: -1 | 1) =>
    cx + side * (halfTop + ((halfBottom - halfTop) * (y - top)) / (bottom - top));
  const body = hot
    ? `M${cx - 29} ${top}H${cx + 29}V${bottom - 9}Q${cx + 29} ${bottom} ${cx + 20} ${bottom}H${cx - 20}Q${cx - 29} ${bottom} ${cx - 29} ${bottom - 9}Z`
    : `M${xAt(top, -1)} ${top}H${xAt(top, 1)}L${xAt(bottom, 1)} ${bottom}H${xAt(bottom, -1)}Z`;
  const span = bottom - fill;
  let y = bottom + 2;
  const bands = layers.map(([color, f], i) => {
    const h = span * f;
    y -= h;
    return <rect key={i} x={0} y={y} width={120} height={h + (i ? 0.5 : 4)} fill={color} stroke="none" />;
  });
  const topColor = layers[layers.length - 1]?.[0] ?? K.coffee;
  const foamH = spec.foam ? (spec.foamH ?? 13) : 0;
  const w = xAt(fill, 1) - xAt(fill, -1);
  const clip = `hop-clip-${uid}`;
  return (
    <svg
      viewBox="0 0 120 140"
      className="hop-art"
      aria-hidden="true"
      fill="none"
      stroke={INK}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <clipPath id={clip}>
          <path d={body} />
        </clipPath>
      </defs>
      <ellipse cx={cx + (hot ? 6 : 0)} cy={bottom + 3} rx={hot ? 42 : 34} ry={4} fill="#e6d6c3" stroke="none" />
      {hot && (
        <>
          <path d={`M${cx + 29} ${top + 14}c19-2 20 32 0 36`} stroke="#ead9c1" strokeWidth={8} />
          <path d={`M${cx + 29} ${top + 10}c24-2 25 41 0 44M${cx + 29} ${top + 18}c13 0 13 26 0 28`} />
        </>
      )}
      <path d={body} fill="#f8ecd8" />
      <g clipPath={`url(#${clip})`}>
        {bands}
        {spec.foam && <rect x={0} y={fill - 1} width={120} height={foamH * 0.6} fill={spec.foam} stroke="none" />}
        {spec.drizzle && (
          <path
            d={`M${cx - 20} ${fill + 8}q7 13 0 25t3 26M${cx + 14} ${fill + 6}q-6 12 2 24t-3 28`}
            stroke={spec.drizzle}
            strokeWidth={3.4}
            opacity={0.85}
          />
        )}
        {!hot && !spec.foam && (
          <g fill="#fff5e8" fillOpacity={0.22} stroke="#fff0d9" strokeWidth={1.4}>
            <rect x={cx - 18} y={fill + 6} width={14} height={14} rx={3} transform={`rotate(12 ${cx - 11} ${fill + 13})`} />
            <rect x={cx + 2} y={fill + 4} width={15} height={15} rx={3} transform={`rotate(-14 ${cx + 9} ${fill + 11})`} />
            <rect x={cx - 6} y={fill + 23} width={13} height={13} rx={3} transform={`rotate(-6 ${cx} ${fill + 29})`} />
          </g>
        )}
        {spec.fizz && (
          <g stroke="#f5e6d4" strokeWidth={1} opacity={0.75}>
            {dots(9, kind.length).map(([a, b], i) => (
              <circle key={i} cx={xAt(fill, -1) + 8 + a * (w - 16)} cy={fill + 10 + b * (span - 20)} r={1.6} />
            ))}
          </g>
        )}
        <path d={`M${xAt(top, -1) + 9} ${fill + 10}l3 30`} stroke="#fff3df" strokeWidth={3} opacity={0.5} />
      </g>
      <path d={body} />
      {!spec.foam && <ellipse cx={cx} cy={fill} rx={w / 2 - 1} ry={3.6} fill={topColor} />}
      {spec.straw && !hot && <path d={`M${cx + 10} ${fill + 26}L${cx + 17} 12l11-5`} stroke="#915e55" strokeWidth={3} />}
      {spec.foam && (
        <path
          d={`M${xAt(fill, -1)} ${fill + 1}C${xAt(fill, -1) + 2} ${fill - foamH - 5} ${xAt(fill, 1) - 2} ${fill - foamH - 5} ${xAt(fill, 1)} ${fill + 1}Z`}
          fill={spec.foam}
        />
      )}
      {spec.top && <Garnishes kinds={spec.top} cx={cx} y={spec.foam ? fill - foamH + 3 : fill + 1} w={w} />}
      {hot && <path className="hop-steam" d={`M${cx - 9} ${top - 8}q-6-7 0-15M${cx + 8} ${top - 8}q-6-7 0-15`} opacity={0.4} />}
    </svg>
  );
}
