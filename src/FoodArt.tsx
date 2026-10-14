export function FoodArt({
  kind: original,
  option,
}: {
  kind: string;
  option?: string;
}) {
  const kind = original.startsWith("momo-")
    ? "momo"
    : original.startsWith("rolls-")
      ? "rolls"
      : original.startsWith("pita-")
        ? "pita"
        : original === "peri-fries"
          ? "fries"
          : original;
  const filling = original.endsWith("chicken")
    ? "#b39173"
    : original.endsWith("paneer")
      ? "#f8edd6"
      : "#94a26f";
  const ink = "#773b39",
    green = "#8b9b63",
    gold = "#c99052";
  const base = {
    stroke: ink,
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg viewBox="0 0 140 120" fill="none" aria-hidden="true" {...base}>
      <ellipse cx="70" cy="105" rx="39" ry="5" fill="#e9d8c8" stroke="none" />
      {kind === "fries" || kind === "cheesy" ? (
        <>
          <ellipse cx="69" cy="95" rx="48" ry="13" fill="#f1dfc3" />
          <path d="M23 77L35 101Q70 111 110 96L120 74Z" fill="#bc7970" />
          <path d="M23 77Q67 64 120 74L108 85Q62 97 23 77Z" fill="#f3dfbc" />
          <g fill={original === "peri-fries" ? "#d99755" : "#e9ba70"}>
            {[
              [34, 44, -18],
              [48, 30, -8],
              [62, 37, 10],
              [76, 26, 14],
              [91, 38, 24],
              [44, 57, -42],
              [66, 51, 53],
              [88, 53, 36],
            ].map(([x, y, r], i) => (
              <g key={i} transform={`rotate(${r} ${x} ${y + 20})`}>
                <rect x={x} y={y} width="10" height="43" rx="2" />
                <path
                  d={`M${x + 3} ${y + 5}v29`}
                  stroke="#f8d99e"
                  strokeWidth="2"
                />
              </g>
            ))}
          </g>
          {original === "peri-fries" && (
            <>
              <g fill="#a84f35" stroke="none">
                {[
                  [42, 55],
                  [53, 39],
                  [65, 48],
                  [78, 35],
                  [89, 49],
                  [53, 67],
                  [80, 67],
                  [98, 69],
                  [67, 77],
                ].map(([x, y]) => (
                  <circle key={`${x}-${y}`} cx={x} cy={y} r="1.8" />
                ))}
              </g>
              <path d="M105 92q13-1 18-13-1 19-17 20Z" fill="#b76149" />
              <path d="m122 79 3-6" stroke="#819060" />
            </>
          )}
          {kind === "cheesy" && (
            <>
              <path
                d="M34 66Q44 56 55 65T77 62T106 67L104 76q-7 0-7 10t-8 0v-9q-8 6-14-1v17q-5 9-9 0V78q-8-6-14 0t-9-4Z"
                fill="#f1ca78"
                stroke="#bc884f"
              />
              <path
                d="M43 65q14 8 25 0m12 2 16 2"
                stroke="#ffdf9e"
                strokeWidth="3"
              />
            </>
          )}
          {original === "fries" && (
            <g stroke="#fff0ce" strokeWidth="2">
              <path d="m44 58 2 0m10-15 1 0m18 8 1 0m18 9 1 0m-21 15 1 0" />
            </g>
          )}
        </>
      ) : kind === "momo" ? (
        <>
          <ellipse cx="69" cy="91" rx="49" ry="15" fill="#e4c799" />
          <path d="M20 89v9q47 23 98 0v-9" fill="#d1a878" />
          <path
            d="M30 98v7m13-3v7m14-5v8m14-7v8m14-10v8m14-11v7m12-10v6"
            opacity=".35"
          />
          {[
            [-20, 1],
            [13, -10],
          ].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              <path
                d="M41 73Q36 62 50 52L65 39q6 10 21 19 15 19-10 26-29 4-35-11Z"
                fill={option === "Fried" ? "#d9a464" : "#f4dfba"}
              />
              <path
                d="M65 42q-15 13-12 29m12-28q-5 18 3 31m-2-29q9 13 14 23"
                stroke="#b9926b"
              />
              <path d="M44 71q4 7 13 9" stroke="#fff0d0" strokeWidth="3" />
            </g>
          ))}
          <path
            d="M63 93Q60 68 86 64q29 1 29 27-22 16-52 2Z"
            fill={option === "Fried" ? "#d9a464" : "#f6e5c5"}
          />
          <path d="M69 90Q68 72 87 71q21 1 21 18-18 12-39 1Z" fill={filling} />
          <FoodFilling kind={original} x={88} y={83} />
          {option !== "Fried" && (
            <path d="M36 38q-5-7 0-13m17 5q-5-7 0-13" opacity=".35" />
          )}
          <ellipse cx="25" cy="87" rx="12" ry="6" fill="#f1ddbf" />
          <ellipse cx="25" cy="86" rx="8" ry="3" fill="#a9543d" stroke="none" />
        </>
      ) : kind === "rolls" ? (
        <>
          <ellipse cx="69" cy="93" rx="50" ry="13" fill="#efddc0" />
          {[
            [-12, 4],
            [10, -7],
          ].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y}) rotate(-32 64 65)`}>
              <rect
                x="49"
                y="28"
                width="23"
                height="68"
                rx="7"
                fill="#dca15d"
              />
              <path d="M54 36v48" stroke="#f5cc88" strokeWidth="3" />
              <path d="m53 48 14 7m-14 9 14 7m-14 8 14 7" stroke="#bb8049" />
              <path
                d="m61 39 1 0m-5 18 1 0m8 20 1 0"
                stroke="#aa7145"
                strokeWidth="2"
              />
            </g>
          ))}
          <path d="M75 96l5-26q13-12 30 2l-1 23Z" fill="#d9a060" />
          <ellipse cx="95" cy="72" rx="18" ry="13" fill="#f2ce8f" />
          <ellipse cx="95" cy="72" rx="13" ry="9" fill={filling} />
          <FoodFilling kind={original} x={95} y={72} />
          <ellipse cx="34" cy="97" rx="12" ry="6" fill="#a6533f" />
        </>
      ) : kind === "pita" ? (
        <>
          <path
            d="M31 91Q16 39 60 25q48-12 53 56-21 32-82 10Z"
            fill="#d9af76"
          />
          <path d="M38 85Q24 47 65 35q35-4 40 43Z" fill="#f5dfb6" />
          <path
            d="M34 68q4-15 14-7 3-22 17-10 8-19 19-4 16-8 18 12l7 22-72 11Z"
            fill="#91a16c"
          />
          {original === "pita-chicken" ? (
            <g fill="#ad7852">
              <ellipse
                cx="57"
                cy="66"
                rx="12"
                ry="20"
                transform="rotate(-32 57 66)"
              />
              <ellipse
                cx="83"
                cy="69"
                rx="12"
                ry="22"
                transform="rotate(23 83 69)"
              />
              <path
                d="m47 58 14 5m-12 4 16 5m13-13 14 5m-16 5 14 5"
                stroke="#815238"
                strokeWidth="2.5"
              />
            </g>
          ) : (
            <g fill="#a7894d">
              <circle cx="52" cy="68" r="14" />
              <circle cx="77" cy="58" r="14" />
              <circle cx="88" cy="81" r="13" />
              <path
                d="m47 63 2-1m7 7 2 1m15-18 2 0m5 8 2 0m-1 20 2 0m7 4 2-1"
                stroke="#6e7847"
                strokeWidth="3"
              />
            </g>
          )}
          <path
            d="M40 79q13-12 19-4m27-24q12 0 14 10"
            stroke="#b66b58"
            strokeWidth="5"
          />
          <path d="M45 79q18 7 24-7t22 7" stroke="#f6ebd4" strokeWidth="4" />
          <path d="M30 77Q66 105 111 78L99 103q-40 20-64-6Z" fill="#e8c48d" />
          <path
            d="m43 89 3 1m15 7 3 0m15-2 2-1m12-5 2-1"
            stroke="#bd935e"
            strokeWidth="2.5"
          />
        </>
      ) : kind === "cup" || kind === "coffee" ? (
        <>
          <ellipse cx="67" cy="98" rx="40" ry="7" fill="#eee0cd" />
          <path d="M95 53h7q20 13 0 28h-8" strokeWidth="6" stroke="#ae6662" />
          <path d="M34 49h61v29q-3 22-31 22T34 78Z" fill="#b76866" />
          <ellipse
            cx="64"
            cy="49"
            rx="30"
            ry="9"
            fill={kind === "coffee" ? "#664134" : "#ead0a8"}
          />
          {kind === "cup" && (
            <path
              d="M50 48q8-9 14 1 7-10 15-1-5 8-15 9-9-3-14-9Z"
              fill="#fcf1dc"
              stroke="none"
            />
          )}
          <path d="M51 33q-9-9 0-17m17 16q-7-8 0-17" opacity=".4" />
        </>
      ) : (
        <>
          <path d="M41 37h58l-7 65q-23 8-44 0Z" fill="#f7e8d3" />
          <path
            d="M44 64h52l-5 36q-22 7-42 0Z"
            fill={
              kind.includes("matcha")
                ? green
                : kind === "berry"
                  ? "#a45b6d"
                  : kind === "strawberry"
                    ? "#d7908b"
                    : kind === "lime"
                      ? "#c3cc8c"
                      : kind === "orange" || kind === "sunrise"
                        ? "#ddaa66"
                        : gold
            }
            stroke="none"
          />
          <path
            d="M43 50h54l-2 21q-22 7-50 0Z"
            fill={
              kind === "pinkmatcha"
                ? "#9aaa70"
                : kind === "mocha" || kind === "cold" || kind === "sunrise"
                  ? "#865842"
                  : "#f5dfbd"
            }
            stroke="none"
          />
          <path d="M41 37h58l-7 65q-23 8-44 0Z" />
          <ellipse
            cx="70"
            cy="37"
            rx="29"
            ry="6"
            fill={
              kind.includes("matcha")
                ? green
                : kind === "berry"
                  ? "#a45b6d"
                  : kind === "lime"
                    ? "#c3cc8c"
                    : "#edd1ab"
            }
          />
          <path d="m77 61 8-43 12-5" strokeWidth="3" />
          {kind === "popcorn" ? (
            <path
              d="M44 33q-8-12 5-14 1-15 13-6 11-10 16 3 17-4 16 10 11 8 0 13"
              fill="#f6e5c1"
            />
          ) : kind === "lime" || kind === "orange" || kind === "sunrise" ? (
            <>
              <circle
                cx="46"
                cy="36"
                r="14"
                fill={kind === "lime" ? "#b5c477" : "#e5b16b"}
              />
              <path
                d="m46 23 0 26m-12-13h24m-21-9 18 18m-18 0 18-18"
                stroke="#f8e8c7"
              />
            </>
          ) : (
            <g stroke="#fff4e3" opacity=".8">
              <rect
                x="52"
                y="47"
                width="11"
                height="11"
                rx="2"
                transform="rotate(10 52 47)"
              />
              <rect
                x="73"
                y="48"
                width="11"
                height="11"
                rx="2"
                transform="rotate(-12 73 48)"
              />
            </g>
          )}
          <path d="m52 77 2 16" stroke="#fff4e3" strokeWidth="3" opacity=".6" />
        </>
      )}
    </svg>
  );
}

function FoodFilling({ kind, x, y }: { kind: string; x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} strokeWidth="1">
      {kind.endsWith("paneer") ? (
        <g fill="#fff2ce" stroke="#bc9b73">
          <rect
            x="-11"
            y="-6"
            width="9"
            height="8"
            rx="1"
            transform="rotate(-15)"
          />
          <rect
            x="1"
            y="-6"
            width="9"
            height="8"
            rx="1"
            transform="rotate(12)"
          />
          <rect x="-3" y="2" width="8" height="7" rx="1" />
        </g>
      ) : kind.endsWith("chicken") ? (
        <g fill="#e1bc91" stroke="#966a4a">
          <path d="m-11-3 10-3 4 4-11 3Zm8 6 11-4 4 4-10 4Zm5-8 7-2 3 4-8 2Z" />
        </g>
      ) : (
        <g stroke="none">
          <path d="m-12-4 8-2 2 4-8 3Zm8 8 9-3 2 4-10 3Z" fill="#dba36a" />
          <path d="m0-6 9 2-1 4-8-2Z" fill="#e9d7a5" />
          <circle cx="-7" cy="3" r="3" fill="#627c49" />
          <circle cx="8" cy="3" r="3" fill="#6d854f" />
        </g>
      )}
    </g>
  );
}
