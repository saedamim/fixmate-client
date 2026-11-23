"use client";

import { useEffect, useState } from "react";
import { callApi, errorMessage } from "@/lib/api";
import { usdMoney } from "@/lib/currency";
import LineChart from "./LineChart";

type Day = { date: string; revenue: number };

// Whole dollars on the axis ($50), cents everywhere else ($12.50)
const formatAmount = (value: number) => (Number.isInteger(value) ? `$${value}` : usdMoney(value));

// Paid amounts per day for the last 30 days, from one of the by-day endpoints. Only confirmed payments count.
export default function RevenueChart({ title, subtitle, path, forbidden }: { title: string; subtitle: string; path: string; forbidden: string }) {
  const [days, setDays] = useState<Day[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    callApi(path, { forbiddenMessage: forbidden })
      .then((result: Day[]) => !ignore && setDays(result))
      .catch((err) => !ignore && setError(errorMessage(err)));
    return () => {
      ignore = true;
    };
  }, [path, forbidden]);

  const total = days?.reduce((sum, d) => sum + d.revenue, 0) ?? 0;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
        </div>
        {days && <p className="text-2xl font-bold text-gray-900">{usdMoney(total)}</p>}
      </div>

      <div className="mt-5">
        {error ? (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
            Could not load this chart: {error}
          </p>
        ) : !days ? (
          <div className="h-[220px] animate-pulse rounded-xl bg-gray-100" aria-busy="true" />
        ) : total === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-600">No confirmed payments in the last 30 days.</p>
        ) : (
          <LineChart data={days.map((d) => ({ date: d.date, value: d.revenue }))} label={title} format={formatAmount} />
        )}
      </div>
    </section>
  );
}
