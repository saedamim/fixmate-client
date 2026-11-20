"use client";

import { useEffect, useState } from "react";
import type { BookingActivity } from "@/lib/data/services";

const ROTATE_MS = 4500;
const FADE_MS = 300;

const statusStyle: Record<BookingActivity["status"], string> = {
  Booked: "bg-teal-50 text-teal-700",
  "Technician on the way": "bg-orange-50 text-orange-600",
  Completed: "bg-green-50 text-green-700",
};

export default function BookingActivityCard({ items }: { items: BookingActivity[] }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (items.length < 2) return;

    let swap: ReturnType<typeof setTimeout>;
    const timer = setInterval(() => {
      setVisible(false); // fade out, swap card, fade back in
      swap = setTimeout(() => {
        setIndex((i) => (i + 1) % items.length);
        setVisible(true);
      }, FADE_MS);
    }, ROTATE_MS);

    return () => {
      clearInterval(timer);
      clearTimeout(swap);
    };
  }, [items.length]);

  const item = items[index];
  if (!item) return null;

  return (
    <div className="mx-auto w-full max-w-sm motion-safe:animate-[float_6s_ease-in-out_infinite] md:ml-auto md:mr-0">
      <div className="rounded-2xl bg-white p-5 text-gray-900 shadow-xl ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <span className="relative flex h-2.5 w-2.5" aria-hidden>
              <span className="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-500" />
            </span>
            Recent Activity
          </p>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
            Sample data
          </span>
        </div>

        <div
          aria-live="polite"
          className={`mt-4 transition duration-300 motion-reduce:transition-none ${
            visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-gray-900">{item.service}</h3>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[item.status]}`}>
              {item.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {item.customer} · {item.location}
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-600">
              Price <span className="text-lg font-bold text-gray-900">${item.price}</span>
            </p>
            <p className="text-sm font-medium text-teal-700">🛡️ {item.warranty}</p>
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-1.5" aria-hidden>
          {items.map((a, i) => (
            <span key={a.id} className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-teal-700" : "w-1.5 bg-gray-300"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
