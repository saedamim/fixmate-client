"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { callApi, errorMessage, SESSION_EXPIRED } from "@/lib/api";

export type Option = { value: string; label: string };

export const forbiddenMessage = "Only admin accounts can view this dashboard.";

export const buttonClass =
  "rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50";

// Shared by the dashboards: a filtered, paginated list with loading, error and empty states
export function ErrorBox({ message, onRetry, signInPath = "/dashboard/admin" }: { message: string; onRetry: () => void; signInPath?: string }) {
  return (
    <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="font-medium text-red-600">{message}</p>
      <div className="mt-4 flex justify-center gap-3">
        <button onClick={onRetry} className="rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white transition hover:bg-orange-600">
          Try again
        </button>
        {message === SESSION_EXPIRED && (
          <Link href={`/sign-in?redirect=${signInPath}`} className={buttonClass}>Sign in</Link>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PagedList: one filtered, paginated list (admin tabs, Transactions, customer Payments).
// `render` receives the current page of items and a reload function.
// ---------------------------------------------------------------------------
export function PagedList<T extends { id: string }>({
  path,
  filterName,
  options,
  noun,
  render,
  signInPath,
  listKey,
  forbidden = forbiddenMessage,
  empty,
}: {
  path: string; // e.g. "/api/admin/users"; the response must hold a list named after it
  filterName: string; // query parameter used by the filter ("role" or "status")
  options: Option[];
  noun: string; // "users", "services", "bookings"
  render: (items: T[], reload: () => void) => React.ReactNode;
  signInPath?: string; // where Sign in returns to after a session error
  listKey?: string; // name of the list in the response (default: the last part of `path`)
  forbidden?: string; // shown when the API answers 403
  empty?: React.ReactNode; // shown instead of "No <noun> found." when there is nothing at all
}) {
  const key = listKey ?? (path.split("/").pop() as string);

  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0); // changes to reload the list
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    const query = new URLSearchParams({ page: String(page), limit: "9" });
    if (filter !== "all") query.set(filterName, filter);

    callApi(`${path}?${query}`, { forbiddenMessage: forbidden })
      .then((result) => {
        if (ignore) return;
        // The current page no longer exists: go to the last page
        if (result[key].length === 0 && page > 1) {
          setPage(result.totalPages || 1);
          return;
        }
        setItems(result[key]);
        setTotal(result.total);
        setTotalPages(result.totalPages);
        setError("");
        setLoading(false);
      })
      .catch((err) => {
        if (ignore) return;
        setError(errorMessage(err));
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [path, key, filterName, filter, page, attempt, forbidden]);

  const selectFilter = (value: string) => {
    if (value === filter && page === 1) return;
    setFilter(value);
    setPage(1);
    setLoading(true);
    setError("");
  };

  const goToPage = (value: number) => {
    setPage(value);
    setLoading(true);
  };

  const retry = () => {
    setLoading(true);
    setError("");
    setAttempt((n) => n + 1);
  };

  const reload = () => setAttempt((n) => n + 1); // quiet reload after an action

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-2" role="group" aria-label={`Filter ${noun}`}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => selectFilter(o.value)}
            aria-pressed={filter === o.value}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              filter === o.value
                ? "border-teal-700 bg-teal-700 text-white"
                : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2" aria-busy="true">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
      ) : error ? (
        <ErrorBox message={error} onRetry={retry} signInPath={signInPath} />
      ) : items.length === 0 ? (
        filter === "all" && empty ? (
          <div className="mt-4">{empty}</div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-600">
            No {noun} found.
          </div>
        )
      ) : (
        <>
          <p className="mt-4 text-sm text-gray-600">{total} {noun}</p>
          <div className="mt-4">{render(items, reload)}</div>

          {totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-4">
              <button onClick={() => goToPage(page - 1)} disabled={page <= 1} className={`${buttonClass} disabled:pointer-events-none disabled:opacity-40`}>
                ← Previous
              </button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages} className={`${buttonClass} disabled:pointer-events-none disabled:opacity-40`}>
                Next →
              </button>
            </nav>
          )}
        </>
      )}
    </>
  );
}
