import { useId } from "react";
import { FoodArt } from "./FoodArt";

type Vessel =
  "cup" | "bowl" | "mug" | "tall" | "short" | "flute" | "shake" | "ribbed";
type Drink = {
  vessel: Vessel;
  layers: [number, string][];
  surface: string;
  foam?: "flat" | "cloud" | "cocoa" | "popcorn";
  accent?: string;
  ice?: boolean;
  fizz?: boolean;
  steam?: boolean;
  latteArt?: boolean;
  caramel?: boolean;
  mint?: boolean;
  straw?: boolean;
  ceramic?: string;
};
const C = {
  milk: "#f5e7cf",
  coffee: "#714839",
  dark: "#4d302d",
  tan: "#c69871",
  green: "#839858",
  pink: "#ce8385",
  orange: "#dfaa5e",
  berry: "#ae596b",
  purple: "#796080",
  gur: "#ad723f",
};
export const drinkArt: Record<string, Drink> = {
  americano: {
    vessel: "mug",
    layers: [[0, C.dark]],
    surface: C.dark,
    steam: true,
    ceramic: "#af676a",
  },
  cappuccino: {
    vessel: "bowl",
    layers: [[0, C.tan]],
    surface: "#f2dec0",
    steam: true,
    latteArt: true,
    ceramic: "#bd8780",
  },
  latte: {
    vessel: "mug",
    layers: [[0, "#d7b48d"]],
    surface: "#c3956d",
    steam: true,
    latteArt: true,
    ceramic: "#ead6ba",
  },
  mocha: {
    vessel: "flute",
    layers: [
      [0, "#9a6c52"],
      [77, "#6b4437"],
    ],
    surface: "#e5c8a5",
    foam: "flat",
    accent: "chocolate",
    steam: true,
  },
  "cold-coffee": {
    vessel: "shake",
    layers: [[0, "#b99476"]],
    surface: "#e2c5a4",
    foam: "flat",
    straw: true,
    accent: "beans",
  },
  vietnamese: {
    vessel: "short",
    layers: [
      [0, C.coffee],
      [80, "#f5e2bc"],
    ],
    surface: "#76503c",
    ice: true,
    accent: "milk",
  },
  popcorn: {
    vessel: "tall",
    layers: [
      [0, "#c39765"],
      [79, "#e9ce9f"],
    ],
    surface: C.milk,
    foam: "popcorn",
    accent: "popcorn",
  },
  tiramisu: {
    vessel: "short",
    layers: [
      [0, "#b58c70"],
      [83, "#755040"],
    ],
    surface: "#e5cfaf",
    foam: "cocoa",
    accent: "cocoa",
  },
  "strawberry-latte": {
    vessel: "tall",
    layers: [
      [0, "#926449"],
      [56, C.milk],
      [86, C.pink],
    ],
    surface: "#916344",
    ice: true,
    accent: "strawberry",
  },
  "cranberry-espresso": {
    vessel: "flute",
    layers: [
      [0, C.coffee],
      [53, C.berry],
      [83, "#bd7180"],
    ],
    surface: C.coffee,
    ice: true,
    fizz: true,
    accent: "cranberry",
  },
  "fridge-cigarette": {
    vessel: "tall",
    layers: [
      [0, "#503832"],
      [84, "#715046"],
    ],
    surface: C.milk,
    foam: "flat",
    fizz: true,
    ice: true,
    straw: true,
  },
  "hot-matcha": {
    vessel: "bowl",
    layers: [[0, C.green]],
    surface: "#8fa666",
    steam: true,
    latteArt: true,
    ceramic: "#b7c29c",
    accent: "matcha",
  },
  "iced-matcha": {
    vessel: "tall",
    layers: [
      [0, C.green],
      [62, "#e5e4c8"],
      [80, C.milk],
    ],
    surface: C.green,
    ice: true,
    accent: "matcha",
  },
  "strawberry-matcha": {
    vessel: "tall",
    layers: [
      [0, C.green],
      [56, C.milk],
      [83, C.pink],
    ],
    surface: C.green,
    ice: true,
    accent: "strawberry",
  },
  "caramel-matcha": {
    vessel: "ribbed",
    layers: [
      [0, "#8e9e6c"],
      [69, "#d7d9b0"],
      [92, "#c59250"],
    ],
    surface: C.green,
    ice: true,
    caramel: true,
    accent: "salt",
  },
  "gur-cloud": {
    vessel: "short",
    layers: [
      [0, "#bd9167"],
      [74, "#dcc19a"],
      [92, C.gur],
    ],
    surface: "#d7b788",
    foam: "cloud",
    ice: true,
    accent: "gur",
  },
  "gur-latte": {
    vessel: "cup",
    layers: [[0, "#ba8c5a"]],
    surface: "#ba8c5a",
    ceramic: "#d0ab79",
    accent: "gur",
  },
  "mango-shorbot": {
    vessel: "ribbed",
    layers: [
      [0, "#d1d297"],
      [84, "#bdc184"],
    ],
    surface: "#d1d297",
    ice: true,
    fizz: true,
    mint: true,
    accent: "mango",
  },
  jamun: {
    vessel: "short",
    layers: [
      [0, "#96789a"],
      [68, "#796080"],
    ],
    surface: "#96789a",
    ice: true,
    fizz: true,
    accent: "jamun",
  },
  mojito: {
    vessel: "flute",
    layers: [[0, "#e1e6c9"]],
    surface: "#e1e6c9",
    ice: true,
    fizz: true,
    mint: true,
    accent: "lime",
  },
  sunset: {
    vessel: "tall",
    layers: [
      [0, "#e5ba73"],
      [67, "#d89469"],
      [88, "#b96770"],
    ],
    surface: "#e5ba73",
    ice: true,
    fizz: true,
    accent: "orange",
  },
  "masala-cola": {
    vessel: "shake",
    layers: [
      [0, "#5e4037"],
      [86, "#795645"],
    ],
    surface: "#9d7959",
    ice: true,
    fizz: true,
    accent: "spice",
  },
  "strawberry-lemonade": {
    vessel: "ribbed",
    layers: [
      [0, "#e6b0a6"],
      [84, "#d99191"],
    ],
    surface: "#e6b0a6",
    ice: true,
    fizz: true,
    accent: "strawberry-lemon",
  },
  sunrise: {
    vessel: "short",
    layers: [
      [0, C.dark],
      [68, "#dba155"],
      [83, "#e7b568"],
    ],
    surface: C.dark,
    ice: true,
    accent: "orange",
  },
};
const vessels: Record<Vessel, { d: string; top: number; rx: number }> = {
  cup: { d: "M35 47H94V76Q94 101 65 102Q35 100 35 76Z", top: 47, rx: 29.5 },
  bowl: { d: "M30 52H101Q98 99 66 100Q33 99 30 52Z", top: 52, rx: 35.5 },
  mug: { d: "M39 38H92V84Q91 102 66 102Q40 102 39 85Z", top: 38, rx: 26.5 },
  tall: { d: "M42 31H95L90 104Q68 110 47 104Z", top: 31, rx: 26.5 },
  short: { d: "M35 48H99L95 101Q67 111 39 101Z", top: 48, rx: 32 },
  flute: { d: "M48 24H91L87 102Q69 109 52 102Z", top: 24, rx: 21.5 },
  shake: {
    d: "M40 28H97L89 66Q83 81 87 101Q69 111 51 101Q55 81 48 65Z",
    top: 28,
    rx: 28.5,
  },
  ribbed: { d: "M40 35H97L92 103Q68 109 45 103Z", top: 35, rx: 28.5 },
};
function Ingredient({ type }: { type?: string }) {
  return (
    <g transform="translate(103 92)">
      {type === "strawberry" || type === "strawberry-lemon" ? (
        <>
          <path
            d="M-7-6Q-14-10-14-1Q-13 9-5 15Q6 7 8-1Q9-10-1-7Z"
            fill="#b96873"
          />
          <path d="m-11-7 6-4 4 3 7-2-5 6-6-1-5 2Z" fill="#80966a" />
          <path
            d="m-9 0 1 2m6-2 1 2m-5 3 1 2m-1 3 1 1"
            stroke="#f6ddb4"
            strokeWidth="1.5"
          />
          {type === "strawberry-lemon" && (
            <g transform="translate(9 -6)">
              <path d="M-5-7A10 10 0 0 1 7 8L-5-7" fill="#e8cc80" />
              <path d="m-3-5 7 9" stroke="#fbedd0" />
            </g>
          )}
        </>
      ) : type === "orange" || type === "lime" ? (
        <>
          <circle
            r="13"
            cy="2"
            fill={type === "orange" ? "#dba361" : "#a5b576"}
          />
          <circle r="10" cy="2" stroke="#faeacb" />
          <path
            d="M0-8V12M-10 2H10M-7-5 7 9M-7 9 7-5"
            stroke="#faeacb"
            strokeWidth="1.2"
          />
        </>
      ) : type === "mango" ? (
        <>
          <path d="M-9 10Q-19-6-6-13Q5-18 11-4Q14 9-9 10Z" fill="#b7bd70" />
          <path d="M-9 10Q-8-5 7-7Q16 2-9 10" fill="#e9d397" />
          <path d="M-4-13q2-7 10-5" />
        </>
      ) : type === "jamun" ? (
        <>
          <ellipse
            cx="-7"
            cy="4"
            rx="7"
            ry="11"
            fill="#68516e"
            transform="rotate(-25)"
          />
          <ellipse
            cx="7"
            cy="4"
            rx="7"
            ry="10"
            fill="#83618a"
            transform="rotate(20)"
          />
          <path d="M-9-2l2-3m9 1 2-3" stroke="#c2a6c5" />
        </>
      ) : type === "cranberry" ? (
        <>
          <circle cx="-6" cy="7" r="6" fill="#a45869" />
          <circle cx="5" cy="5" r="6" fill="#b86978" />
          <circle cx="-1" cy="-4" r="6" fill="#ad5a6c" />
          <path d="m-3-10 6-7q8 0 7 5-5 5-10 2" fill="#8b9e74" />
        </>
      ) : type === "chocolate" ? (
        <g transform="rotate(-15)">
          <rect x="-13" y="-6" width="23" height="19" rx="2" fill="#815543" />
          <path d="M-2-5v17m-10-9h21" stroke="#b3815e" />
        </g>
      ) : type === "gur" ? (
        <>
          <path d="m-13 3 10-6 13 6-3 11-15 0Z" fill="#b07d47" />
          <path d="m-13 3 14 5 9-5M1 8l-1 6" stroke="#dbb77e" />
          <path d="M0-9q7-11 9-6t-4 8" stroke="#a26b3b" strokeWidth="3" />
        </>
      ) : type === "matcha" ? (
        <>
          <path d="M-10 4Q0-7 11 4Z" fill="#829955" />
          <path d="M-14 5H14Q12 15 0 15T-14 5Z" fill="#ded7b8" />
        </>
      ) : type === "milk" ? (
        <>
          <path d="M-9-10H8L12-4V13H-9Z" fill="#f4e9d3" />
          <path d="M-9-10-4-15H5L8-10M-9-4h21" />
          <path d="M-2 0q-8 9 0 9t0-9" fill="#d9c4a1" stroke="none" />
        </>
      ) : type === "beans" ? (
        <g fill="#795341">
          <ellipse cx="-5" cy="5" rx="5" ry="8" transform="rotate(-25)" />
          <ellipse cx="7" cy="5" rx="5" ry="8" transform="rotate(25)" />
          <path d="m-6-2 2 10m11-10-2 10" stroke="#bf9870" />
        </g>
      ) : type === "salt" ? (
        <>
          <path d="M-12 7Q0-2 12 7L8 13H-8Z" fill="#cf9c60" />
          <path
            d="m-4-4 2-3 3 2-2 3Zm9 0 3-2 2 3-3 2Zm-14 1 2-2 2 3"
            stroke="#fcf4e4"
            fill="#fcf4e4"
          />
        </>
      ) : type === "cocoa" || type === "spice" ? (
        <>
          <ellipse
            cx="0"
            cy="7"
            rx="13"
            ry="5"
            fill={type === "cocoa" ? "#895c47" : "#a47852"}
          />
          <path d="M-13 7q3 11 13 11T13 7" fill="#d8b796" />
          <path d="m-6 5 1 0m5-1 1 0m3 3 1 0" stroke="#f6dfbd" />
        </>
      ) : type === "popcorn" ? (
        <Popcorn x={0} y={6} />
      ) : null}
    </g>
  );
}
function Popcorn({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d="M-5 5q-10-1-7-8 1-5 6-3-3-9 4-10 7-1 7 7 9-3 11 4 1 8-8 8 0 8-7 7Z"
        fill="#f1d8a3"
      />
      <path d="m-4-2 5-3 4 4-5 4Z" fill="#ce9b57" stroke="none" />
    </g>
  );
}
export function Art({ kind, option }: { kind: string; option?: string }) {
  const uid = useId().replace(/:/g, "");
  const original = drinkArt[kind];
  if (!original) return <FoodArt kind={kind} option={option} />;
  const cold = option === "Iced" || option === "Cold";
  const d: Drink =
    option === "Hot"
      ? {
          ...original,
          ice: false,
          straw: false,
          steam: true,
          ...(kind === "vietnamese" ||
          kind === "popcorn" ||
          kind === "tiramisu" ||
          kind === "gur-latte"
            ? { vessel: "mug" as Vessel }
            : {}),
        }
      : cold
        ? {
            ...original,
            vessel: original.steam ? "tall" : original.vessel,
            ceramic: undefined,
            steam: false,
            latteArt: false,
            ice: kind === "cold-coffee" ? false : true,
          }
        : original;
  const v = vessels[d.vessel],
    cx =
      d.vessel === "cup"
        ? 64.5
        : d.vessel === "bowl"
          ? 65.5
          : d.vessel === "mug"
            ? 65.5
            : d.vessel === "short"
              ? 67
              : 68.5;
  return (
    <svg
      viewBox="0 0 140 120"
      fill="none"
      aria-hidden="true"
      stroke="#773b39"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      data-art={kind}
    >
      <defs>
        <clipPath id={uid}>
          <path d={v.d} />
        </clipPath>
      </defs>
      <ellipse cx="70" cy="109" rx="42" ry="4" fill="#e6d6c3" stroke="none" />
      {(d.ceramic || (option === "Hot" && d.vessel === "mug")) && (
        <>
          <ellipse cx="66" cy="104" rx="41" ry="5" fill="#eee0cb" />
          <path
            d={`M93 ${v.top + 8}C119 ${v.top + 3} 116 87 93 82`}
            stroke={d.ceramic || "#d9bda0"}
            strokeWidth="9"
          />
          <path
            d={`M96 ${v.top + 8}C118 ${v.top + 7} 113 84 95 81`}
            strokeWidth="1.4"
          />
        </>
      )}
      <path d={v.d} fill={d.ceramic || "#f8ecd8"} />
      {!d.ceramic && (
        <g clipPath={`url(#${uid})`}>
          {d.layers.map(([y, color], i) => (
            <rect
              key={i}
              x="25"
              y={y || v.top}
              width="80"
              height={120 - (y || v.top)}
              fill={color}
              stroke="none"
            />
          ))}
          {d.caramel && (
            <path
              d="M44 49q9 9 10 38t9-14q2-24 9-17t8 32q3 17 12 3"
              stroke="#bc874e"
              strokeWidth="4"
              opacity=".9"
            />
          )}
          {d.mint && (
            <g fill="#87a26e" stroke="#708258" strokeWidth="1">
              <path d="M57 77Q43 63 59 62q8 9-2 15M75 94Q62 80 78 79q7 8-3 15M80 57Q71 44 87 45q5 8-7 12" />
            </g>
          )}
          {d.fizz && (
            <g stroke="#f5e6d4" strokeWidth="1" opacity=".75">
              {[
                [55, 64],
                [80, 84],
                [72, 71],
                [59, 91],
                [86, 53],
                [66, 98],
              ].map(([x, y]) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r="1.8" />
              ))}
            </g>
          )}
          {d.ice && (
            <g
              fill="#fff5e8"
              fillOpacity=".22"
              stroke="#fff0d9"
              strokeWidth="1.4"
            >
              <rect
                x="51"
                y={v.top + 7}
                width="13"
                height="13"
                rx="3"
                transform={`rotate(14 57 ${v.top + 13})`}
              />
              <rect
                x="72"
                y={v.top + 9}
                width="14"
                height="14"
                rx="3"
                transform={`rotate(-16 77 ${v.top + 15})`}
              />
              {!d.foam && (
                <rect
                  x="61"
                  y={v.top + 25}
                  width="12"
                  height="12"
                  rx="2"
                  transform={`rotate(-9 66 ${v.top + 30})`}
                />
              )}
            </g>
          )}
          {d.vessel === "ribbed" && (
            <g stroke="#f7ead6" opacity=".5">
              {[49, 59, 69, 79, 89].map((x) => (
                <path key={x} d={`M${x} 43v57`} />
              ))}
            </g>
          )}
          <path
            d={`M49 ${v.top + 14}l3 24`}
            stroke="#fff3df"
            strokeWidth="3"
            opacity=".5"
          />
        </g>
      )}
      <path d={v.d} />
      <ellipse cx={cx} cy={v.top} rx={v.rx} ry="5.5" fill={d.surface} />
      {d.latteArt && (
        <g fill="#fff2d9" stroke="none">
          <path
            d={`M${cx} ${v.top + 3}q-17-7-12-9 7-3 12 4 6-8 13-4 4 4-13 9Z`}
          />
          <path
            d={`M${cx - 1} ${v.top + 5}q-1-6 5-9`}
            stroke="#e2c8a5"
            strokeWidth="1"
          />
        </g>
      )}
      {d.straw && (
        <path
          d={`M80 ${v.top + 24}L86 16l12-6`}
          stroke="#915e55"
          strokeWidth="3"
        />
      )}
      {d.foam === "flat" && (
        <path
          d={`M${cx - v.rx + 1} ${v.top}q${v.rx} -10 ${v.rx * 2 - 2} 0v8q-${v.rx} 7-${v.rx * 2 - 2} 0Z`}
          fill={kind === "fridge-cigarette" ? "#f6e9d4" : "#ecd9bb"}
        />
      )}
      {(d.foam === "cloud" || d.foam === "popcorn") && (
        <path
          d={`M${cx - v.rx} ${v.top + 1}q-4-10 7-12 2-12 13-8 8-11 17-3 12-5 14 6 14 0 10 15q-25 10-61 2Z`}
          fill={d.foam === "cloud" ? "#e1c294" : "#f5e4c3"}
        />
      )}
      {d.foam === "popcorn" && (
        <>
          <Popcorn x={57} y={v.top - 12} />
          <Popcorn x={80} y={v.top - 14} />
        </>
      )}
      {d.foam === "cocoa" && (
        <>
          <path
            d={`M36 ${v.top - 10}Q65 ${v.top - 24} 98 ${v.top - 10}v24q-33 7-62 0Z`}
            fill="#f2e3cc"
          />
          <ellipse
            cx="67"
            cy={v.top - 10}
            rx="29"
            ry="5"
            fill="#9b7256"
            stroke="none"
          />
          {[45, 52, 59, 68, 77, 87].map((x, i) => (
            <circle
              key={x}
              cx={x}
              cy={v.top - 10 + (i % 2) * 2}
              r="1"
              fill="#654232"
              stroke="none"
            />
          ))}
        </>
      )}
      {d.steam && (
        <g opacity=".4">
          <path d={`M54 ${v.top - 13}q-6-7 0-15M72 ${v.top - 14}q-6-7 0-15`} />
        </g>
      )}
      {d.mint && (
        <path
          d={`M89 ${v.top + 3}q-6-21 8-21 3 12-8 21m0-3q10-20 17-11-4 10-17 11`}
          fill="#8c9f70"
          stroke="#718456"
        />
      )}
      <Ingredient type={d.accent} />
    </svg>
  );
}
