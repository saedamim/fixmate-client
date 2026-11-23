"use client";

import { useEffect, useRef, useState } from "react";

export type LinePoint = { date: string; value: number }; // date: YYYY-MM-DD

const HEIGHT = 220;
const MARGIN = { top: 12, right: 16, bottom: 28, left: 52 };

// A round upper bound for the y axis (1, 2, 2.5, 5 or 10 times a power of ten)
function niceMax(max: number) {
  if (max <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(max));
  return [1, 2, 2.5, 5, 10].map((m) => m * power).find((m) => m >= max) ?? max;
}

const shortDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

// One series over time as a 2px line with a faint area under it. A crosshair follows the pointer (or the arrow keys)
// and a tooltip shows that day's value; a hidden table gives screen readers the same numbers.
export default function LineChart({ data, label, format }: { data: LinePoint[]; label: string; format: (value: number) => string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);

  // Draw at the real pixel width so text keeps its size on a phone
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(Math.round(entry.contentRect.width), 240)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const yMax = niceMax(Math.max(...data.map((d) => d.value), 0));
  const x = (i: number) => MARGIN.left + (data.length > 1 ? (i / (data.length - 1)) * plotW : plotW / 2);
  const y = (v: number) => MARGIN.top + plotH - (v / yMax) * plotH;

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`;
  const ticks = [0, yMax / 2, yMax];
  const labelAt = [0, Math.floor((data.length - 1) / 2), data.length - 1];

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left - MARGIN.left) / plotW;
    setActive(Math.min(Math.max(Math.round(ratio * (data.length - 1)), 0), data.length - 1));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const step = e.key === "ArrowRight" ? 1 : -1;
    setActive((i) => Math.min(Math.max((i ?? (step > 0 ? -1 : data.length)) + step, 0), data.length - 1));
  };

  const point = active === null ? null : data[active];
  const shown = point ?? data[data.length - 1];

  return (
    <div
      ref={wrapRef}
      className="relative"
      tabIndex={0}
      role="group"
      aria-label={`${label}. Use the left and right arrow keys to read each day.`}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <svg width={width} height={HEIGHT} onPointerMove={onPointerMove} onPointerLeave={() => setActive(null)} aria-hidden className="block touch-pan-y">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(t)} y2={y(t)} stroke="#e5e7eb" strokeWidth="1" />
            <text x={MARGIN.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize="11" fill="#6b7280">
              {format(t)}
            </text>
          </g>
        ))}
        {labelAt.map((i, n) => (
          <text key={i} x={x(i)} y={HEIGHT - 8} textAnchor={n === 0 ? "start" : n === 2 ? "end" : "middle"} fontSize="11" fill="#6b7280">
            {shortDate(data[i].date)}
          </text>
        ))}

        <path d={area} fill="#0f766e" fillOpacity="0.1" />
        <path d={line} fill="none" stroke="#0f766e" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {point && active !== null && <line x1={x(active)} x2={x(active)} y1={MARGIN.top} y2={MARGIN.top + plotH} stroke="#9ca3af" strokeWidth="1" />}
        {/* End dot, or the hovered day's dot, with a 2px surface ring */}
        <circle cx={x(active ?? data.length - 1)} cy={y(shown.value)} r="4" fill="#0f766e" stroke="#fff" strokeWidth="2" />
      </svg>

      {point && active !== null && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-gray-300 shadow-lg"
          style={{ left: Math.min(Math.max(x(active), 56), width - 56) }}
        >
          <strong className="block text-sm font-semibold text-white">{format(point.value)}</strong>
          {shortDate(point.date)}
        </div>
      )}

      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <td>{d.date}</td>
              <td>{format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
