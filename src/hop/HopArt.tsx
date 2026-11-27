import { useId } from "react";

// One drawing language: the clear takeaway cup from the HOP photos (iced) and a
// clear glass mug (hot), both showing the real layers, foam and garnish.
const K = {
  espresso: "#3d2217",
  coldbrew: "#4a2a1c",
  coffee: "#7a4b2e",
  latte: "#c39467",
  milk: "#f4ead8",
  condensed: "#ecd5a6",
  choc: "#5b3122",
  chocMilk: "#8a5640",
  foam: "#fbf4ea",
  matcha: "#8fae55",
  strawberry: "#e4788a",
  cherry: "#9d1c34",
  cranberry: "#b3263f",
  orange: "#f0a242",
  cola: "#3a1a12",
  pom: "#c51f3d",
  lime: "#e6efc2",
  apple: "#a9d45c",
  caramel: "#c98536",
  maple: "#b5651f",
  biscoff: "#b9743a",
  cinnamon: "#8a4524",
  cocoa: "#4a2416",
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
export function BrandMark({ cx, y, h }: { cx: number; y: number; h: number }) {
  const w = (h * MARK.w) / MARK.h;
  return (
    <svg x={cx - w / 2} y={y} width={w} height={h} viewBox={`${MARK.x} ${MARK.y} ${MARK.w} ${MARK.h}`} opacity={0.9}>
      <image href="/brand-logo.png" width={1254} height={1254} />
    </svg>
  );
}
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

function Garnishes({
  kinds,
  cx,
  y,
  w,
}: {
  kinds: Garnish[];
  cx: number;
  y: number;
  w: number;
}) {
  return (
    <g>
      {kinds.map((k, gi) => {
        if (k === "cocoa" || k === "cinnamon" || k === "salt") {
          const c = k === "cocoa" ? K.cocoa : k === "cinnamon" ? K.cinnamon : "#ffffff";
          return (
            <g key={k} opacity={k === "salt" ? 0.95 : 0.8}>
              {dots(k === "salt" ? 9 : 22, gi + 1).map(([a, b], i) =>
                k === "salt" ? (
                  <rect
                    key={i}
                    x={cx - w / 2 + 6 + a * (w - 12)}
                    y={y - 3 + b * 5}
                    width={2.6}
                    height={2.6}
                    rx={0.4}
                    fill={c}
                    stroke="#d9cfc4"
                    strokeWidth={0.4}
                    transform={`rotate(${a * 60} ${cx - w / 2 + 6 + a * (w - 12)} ${y + b * 5})`}
                  />
                ) : (
                  <circle
                    key={i}
                    cx={cx - w / 2 + 6 + a * (w - 12)}
                    cy={y - 2 + b * 5}
                    r={0.8 + b * 0.9}
                    fill={c}
                  />
                ),
              )}
            </g>
          );
        }
        if (k === "popcorn")
          return (
            <g key={k}>
              {[
                [-10, -3],
                [0, -6],
                [9, -2],
                [3, 0],
              ].map(([dx, dy], i) => (
                <g key={i} transform={`translate(${cx + dx} ${y + dy})`}>
                  <circle r={3.6} fill="#fbeec6" stroke="#e0c27a" strokeWidth={0.6} />
                  <circle cx={2.6} cy={-1.4} r={2.8} fill="#fff6dc" stroke="#e0c27a" strokeWidth={0.6} />
                  <circle cx={0.8} cy={2.2} r={1.1} fill="#d79a3c" />
                </g>
              ))}
            </g>
          );
        if (k === "biscuit")
          return (
            <g key={k} transform={`translate(${cx + 6} ${y - 11}) rotate(14)`}>
              <rect x={-8} y={-6} width={17} height={13} rx={2.5} fill="#c07a3e" stroke="#9a5a26" strokeWidth={0.8} />
              {[-4, 0, 4].map((x) =>
                [-2, 2].map((yy) => (
                  <circle key={`${x}${yy}`} cx={x + 0.5} cy={yy + 0.5} r={0.7} fill="#9a5a26" />
                )),
              )}
            </g>
          );
        if (k === "cherry")
          return (
            <g key={k} transform={`translate(${cx + 2} ${y - 5})`}>
              <path d="M0 -3 C 2 -10 6 -13 9 -14" stroke="#5b7a35" strokeWidth={1.3} fill="none" strokeLinecap="round" />
              <circle r={5} fill="#b0122e" />
              <circle cx={-1.6} cy={-1.6} r={1.4} fill="#fff" opacity={0.55} />
            </g>
          );
        if (k === "berries" || k === "pom")
          return (
            <g key={k}>
              {dots(k === "pom" ? 9 : 5, gi + 4).map(([a, b], i) => (
                <circle
                  key={i}
                  cx={cx - w / 2 + 10 + a * (w - 20)}
                  cy={y - 2 + b * 4}
                  r={k === "pom" ? 2 : 2.8}
                  fill={k === "pom" ? "#d3163b" : "#a3162f"}
                  stroke="#7c0d22"
                  strokeWidth={0.4}
                />
              ))}
            </g>
          );
        if (k === "strawberry")
          return (
            <g key={k} transform={`translate(${cx - 8} ${y - 6}) rotate(-18)`}>
              <path d="M0 -8 C 7 -8 9 -2 0 8 C -9 -2 -7 -8 0 -8 Z" fill="#e23b52" />
              {dots(6, 7).map(([a, b], i) => (
                <circle key={i} cx={-4 + a * 8} cy={-4 + b * 8} r={0.55} fill="#ffe6a8" />
              ))}
              <path d="M-4 -8 L0 -11 L4 -8" stroke="#4f8f3e" strokeWidth={2} fill="none" strokeLinecap="round" />
            </g>
          );
        if (k === "mint")
          return (
            <g key={k} transform={`translate(${cx - 4} ${y - 6})`}>
              <ellipse rx={7} ry={3.6} fill="#4f9a4a" transform="rotate(-35)" />
              <ellipse cx={7} cy={-3} rx={6} ry={3.2} fill="#6cb35d" transform="rotate(25 7 -3)" />
              <path d="M-5 3 L4 -4" stroke="#2f6b2d" strokeWidth={0.7} />
            </g>
          );
        if (k === "lime")
          return (
            <g key={k} transform={`translate(${cx + w / 2 - 6} ${y - 1})`}>
              <circle r={10} fill="#8cc63f" />
              <circle r={8.4} fill="#e9f5bd" />
              {Array.from({ length: 8 }, (_, i) => (
                <line
                  key={i}
                  x1={0}
                  y1={0}
                  x2={Math.cos((i * Math.PI) / 4) * 8}
                  y2={Math.sin((i * Math.PI) / 4) * 8}
                  stroke="#bcd97a"
                  strokeWidth={0.9}
                />
              ))}
            </g>
          );
        return null;
      })}
    </g>
  );
}

function Bottle({ color, label }: { color: string; label: string }) {
  return (
    <svg viewBox="0 0 120 140" className="hop-art" aria-hidden="true">
      <ellipse cx={60} cy={131} rx={30} ry={4} fill="#5a1220" opacity={0.08} />
      <rect x={53} y={16} width={14} height={8} rx={2} fill="#2b2b2b" />
      <path d="M55 24 h10 v8 c0 4 14 8 14 20 v66 a9 9 0 0 1 -9 9 h-20 a9 9 0 0 1 -9 -9 v-66 c0 -12 14 -16 14 -20 z" fill={color} />
      <path d="M48 58 v50" stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.35} />
      <rect x={44} y={66} width={32} height={34} rx={4} fill="#fbf5ec" />
      <BrandMark cx={60} y={69} h={19} />
      <text x={60} y={95} textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize={5.2} letterSpacing={0.6} fill="#7d1a2c">
        {label}
      </text>
    </svg>
  );
}

function Shot() {
  return (
    <svg viewBox="0 0 120 140" className="hop-art" aria-hidden="true">
      <ellipse cx={60} cy={131} rx={28} ry={4} fill="#5a1220" opacity={0.08} />
      <path d="M38 56 h44 l-5 70 a4 4 0 0 1 -4 4 h-26 a4 4 0 0 1 -4 -4 z" fill="#fff" opacity={0.35} stroke="#d8cdc2" strokeWidth={1.4} />
      <path d="M41.5 74 h37 l-3.7 52 h-29.6 z" fill={K.espresso} />
      <path d="M41.5 74 h37 l-0.5 7 h-36 z" fill="#c8874a" />
      <path d="M44 62 v58" stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.5} />
      <path d="M54 46 c-4 -6 4 -9 0 -16 M66 46 c-4 -6 4 -9 0 -16" stroke="#c8b8a8" strokeWidth={2} fill="none" strokeLinecap="round" className="hop-steam" />
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
  if (hot && kind.includes("matcha"))
    layers = [[K.matcha, 1]]; // hot matcha is mixed, not layered

  // Geometry: iced = tapered clear cup; hot = straight glass mug.
  const top = hot ? 50 : 24,
    bottom = hot ? 126 : 130,
    fill = hot ? 60 : 38;
  const halfTop = hot ? 30 : 38,
    halfBottom = hot ? 30 : 27,
    cx = hot ? 56 : 60;
  const xAt = (y: number, side: -1 | 1) => {
    const t = (y - top) / (bottom - top);
    return cx + side * (halfTop + (halfBottom - halfTop) * t);
  };
  const body = hot
    ? `M${cx - 30} ${top} H${cx + 30} V${bottom - 10} Q${cx + 30} ${bottom} ${cx + 20} ${bottom} H${cx - 20} Q${cx - 30} ${bottom} ${cx - 30} ${bottom - 10} Z`
    : `M${xAt(top, -1)} ${top} L${xAt(top, 1)} ${top} L${xAt(bottom, 1) - 2} ${bottom} Q${cx} ${bottom + 3} ${xAt(bottom, -1) + 2} ${bottom} Z`;
  const span = bottom - fill;
  let y = bottom + 2;
  const bands = layers.map(([color, f], i) => {
    const h = span * f;
    y -= h;
    return (
      <rect key={i} x={0} y={y} width={120} height={h + (i ? 0.5 : 4)} fill={color} />
    );
  });
  const foamH = spec.foam ? (spec.foamH ?? 15) : 0;
  const surfaceW = xAt(fill, 1) - xAt(fill, -1);
  const garnishY = fill - foamH + 2;
  const clip = `hop-clip-${uid}`;
  return (
    <svg viewBox="0 0 120 140" className="hop-art" aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <path d={body} />
        </clipPath>
        <linearGradient id={`glass-${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.5} />
          <stop offset="0.25" stopColor="#fff" stopOpacity={0.08} />
          <stop offset="0.8" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#fff" stopOpacity={0.3} />
        </linearGradient>
      </defs>
      <ellipse cx={cx} cy={bottom + 4} rx={hot ? 38 : 32} ry={4.5} fill="#5a1220" opacity={0.09} />
      {hot && (
        <path
          d={`M${cx + 30} ${top + 16} c18 0 20 30 0 34`}
          fill="none"
          stroke="#e4dad0"
          strokeWidth={6}
          strokeLinecap="round"
        />
      )}
      <g clipPath={`url(#${clip})`}>
        <rect x={0} y={0} width={120} height={140} fill="#fff" opacity={0.35} />
        {bands}
        {spec.foam && (
          <rect x={0} y={fill - 1} width={120} height={foamH * 0.7} fill={spec.foam} />
        )}
        {spec.drizzle && (
          <path
            d={`M${cx - 26} ${fill + 6} q 8 14 0 26 t 2 26 M${cx + 18} ${fill + 4} q -7 12 2 24 t -3 30 M${cx - 4} ${fill + 10} q 6 10 -2 22`}
            stroke={spec.drizzle}
            strokeWidth={3.2}
            fill="none"
            strokeLinecap="round"
            opacity={0.75}
          />
        )}
        {!hot &&
          !spec.foam &&
          [
            [cx - 20, fill + 6, -8],
            [cx + 2, fill + 2, 12],
            [cx + 12, fill + 22, -4],
          ].map(([x, yy, r], i) => (
            <rect
              key={i}
              x={x}
              y={yy}
              width={16}
              height={15}
              rx={3}
              fill="#fff"
              opacity={0.32}
              stroke="#fff"
              strokeOpacity={0.7}
              transform={`rotate(${r} ${x + 8} ${yy + 7})`}
            />
          ))}
        {spec.fizz &&
          dots(14, kind.length).map(([a, b], i) => (
            <circle
              key={i}
              cx={xAt(fill, -1) + 6 + a * (surfaceW - 12)}
              cy={fill + 8 + b * (span - 16)}
              r={0.8 + a * 1.3}
              fill="none"
              stroke="#fff"
              strokeOpacity={0.75}
              strokeWidth={0.8}
            />
          ))}
        <BrandMark cx={cx} y={hot ? 84 : 78} h={24} />
        <rect x={0} y={0} width={120} height={140} fill={`url(#glass-${uid})`} />
      </g>
      {spec.straw && !hot && (
        <g transform={`rotate(14 ${cx + 10} ${fill})`}>
          <rect x={cx + 6} y={6} width={6} height={fill + 20} rx={2} fill="#fff" stroke="#e8dcd2" strokeWidth={0.6} />
          {Array.from({ length: 8 }, (_, i) => (
            <path key={i} d={`M${cx + 6} ${12 + i * 8} l6 -4 v3 l-6 4 z`} fill="#b3203a" />
          ))}
        </g>
      )}
      {spec.foam && (
        <path
          d={`M${xAt(fill, -1) + 1} ${fill} C ${xAt(fill, -1) + 2} ${fill - foamH - 4}, ${xAt(fill, 1) - 2} ${fill - foamH - 4}, ${xAt(fill, 1) - 1} ${fill} Z`}
          fill={spec.foam}
          stroke="#00000010"
        />
      )}
      {spec.top && (
        <Garnishes kinds={spec.top} cx={cx} y={spec.foam ? garnishY : fill + 2} w={surfaceW} />
      )}
      <path d={body} fill="none" stroke="#d7cbc0" strokeWidth={1.6} />
      <path
        d={hot ? `M${cx - 24} ${top + 10} V${bottom - 14}` : `M${xAt(top, -1) + 7} ${top + 10} L${xAt(bottom, -1) + 6} ${bottom - 10}`}
        stroke="#fff"
        strokeWidth={3.2}
        strokeLinecap="round"
        opacity={0.6}
      />
      {hot && (
        <path
          className="hop-steam"
          d={`M${cx - 10} ${top - 8} c-5 -7 5 -10 0 -18 M${cx + 6} ${top - 6} c-5 -7 5 -10 0 -18`}
          stroke="#cdbfb2"
          strokeWidth={2.2}
          fill="none"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
