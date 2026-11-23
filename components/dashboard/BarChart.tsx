export type BarDatum = { label: string; value: number; color: string }; // color: a Tailwind background class

// A ranked-style horizontal bar chart in plain HTML. Bars start at one baseline, each carries its value at the tip,
// and hovering or focusing a row shows its share. A hidden table gives screen readers the same numbers.
export default function BarChart({ title, subtitle, data }: { title: string; subtitle?: string; data: BarDatum[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}

      <ul className="mt-5 space-y-2" aria-hidden>
        {data.map((d) => (
          <li
            key={d.label}
            tabIndex={0}
            className="group relative grid grid-cols-[6.5rem_1fr] items-center gap-3 rounded-md py-1 outline-none focus-visible:ring-2 focus-visible:ring-teal-200 sm:grid-cols-[8rem_1fr]"
          >
            <span className="truncate text-sm text-gray-700">{d.label}</span>
            <div className="flex items-center gap-3 border-l border-gray-200">
              {/* A bar is at most 20px thick with a 4px rounded tip; a zero value draws nothing */}
              <div
                className={`h-5 rounded-r-[4px] transition-all duration-300 group-hover:brightness-110 group-focus-visible:brightness-110 ${d.color}`}
                style={{ width: `${(d.value / max) * 100}%`, maxWidth: "calc(100% - 3rem)" }}
              />
              <span className="text-sm font-semibold text-gray-900">{d.value}</span>
            </div>

            <span
              role="tooltip"
              className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-gray-300 shadow-lg group-hover:block group-focus-visible:block"
            >
              <strong className="text-sm font-semibold text-white">{d.value}</strong> {d.label}
              {total > 0 && ` · ${Math.round((d.value / total) * 100)}%`}
            </span>
          </li>
        ))}
      </ul>

      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr><th>Category</th><th>Count</th></tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}><td>{d.label}</td><td>{d.value}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
