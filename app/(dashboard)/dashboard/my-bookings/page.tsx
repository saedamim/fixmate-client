"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { callApi, errorMessage, SESSION_EXPIRED } from "@/lib/api";
import { formatDate, statusLabel, statusStyle, type BookingStatus as Status } from "@/lib/bookings";
import { usd, usdMoney } from "@/lib/currency";
import { formatDateTime, type Payment } from "@/lib/payments";

type Booking = {
  id: string;
  serviceTitle: string;
  category: string;
  price: number;
  technician: string;
  preferredDate: string;
  preferredTime: string;
  status: Status;
  paymentStatus: string; // "unpaid" or "paid"; only the backend sets it, after Stripe confirms
  finalAmount?: number; // set by the technician when the work is completed
};

// Sent by GET /api/bookings/my: counts cover all of this customer's bookings
type Counts = Record<Status | "total", number>;

const filters: { value: "all" | Status; label: string }[] = [
  { value: "all", label: "All" },
  { value: "requested", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rejected", label: "Rejected" },
];

const forbiddenMessage = "Only customer accounts can view bookings.";

// Stripe Checkout pages live on checkout.stripe.com: never send the browser anywhere else
const isStripeCheckoutUrl = (value: unknown): value is string => {
  try {
    const url = new URL(String(value));
    return url.protocol === "https:" && url.hostname === "checkout.stripe.com";
  } catch {
    return false;
  }
};

const buttonClass =
  "rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50";

export default function MyBookingsPage() {
  const { data: session, isPending } = useSession();
  const isCustomer = session?.user.role === "customer";

  const [filter, setFilter] = useState<"all" | Status>("all");
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0); // changes to reload after an error
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paidByBooking, setPaidByBooking] = useState<Record<string, Payment>>({}); // confirmed payments, by booking id

  const [confirming, setConfirming] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  // Payment: the booking being sent to Stripe Checkout, and a per-booking error
  const [payingId, setPayingId] = useState("");
  const [payError, setPayError] = useState<{ id: string; message: string } | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const dialogOpen = confirming !== null;

  // Load the customer's bookings whenever the filter or page changes
  useEffect(() => {
    if (!isCustomer) return;

    let ignore = false;
    const query = new URLSearchParams({ page: String(page), limit: "9" });
    if (filter !== "all") query.set("status", filter);

    callApi(`/api/bookings/my?${query}`, { forbiddenMessage })
      .then((result) => {
        if (ignore) return;
        // The current page no longer exists (for example after a cancel): go to the last page
        if (result.bookings.length === 0 && page > 1) {
          setPage(result.totalPages || 1);
          return;
        }
        setBookings(result.bookings);
        setCounts(result.counts);
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
  }, [isCustomer, filter, page, attempt]);

  // Payment details (amount, transaction id, date) for the paid bookings shown on this page. One lookup by booking id,
  // so it never depends on how many payments the customer has. Optional: bookings still work without it.
  useEffect(() => {
    const ids = bookings.filter((b) => b.paymentStatus === "paid").map((b) => b.id);
    if (!isCustomer || ids.length === 0) return;

    let ignore = false;
    callApi(`/api/payments/my?status=paid&limit=50&bookingIds=${ids.join(",")}`, { forbiddenMessage })
      .then((result: { payments: Payment[] }) => {
        if (!ignore) setPaidByBooking((current) => ({ ...current, ...Object.fromEntries(result.payments.map((p) => [p.bookingId, p])) }));
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, [isCustomer, bookings]);

  // Coming back with the browser's Back button restores this page from cache: unlock Pay and reload
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      setPayingId("");
      setAttempt((n) => n + 1);
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  // Dialog keyboard: Escape closes it, Tab stays inside it
  useEffect(() => {
    if (!dialogOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !cancelling) setConfirming(null);
      if (e.key !== "Tab") return;

      const buttons = dialogRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled)");
      if (!buttons?.length) return e.preventDefault();

      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      const active = document.activeElement;

      if (!dialogRef.current?.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dialogOpen, cancelling]);

  // Move focus into the dialog when it opens and give it back when it closes
  useEffect(() => {
    if (!dialogOpen) return;

    const opener = document.activeElement;
    const heading = headingRef.current;
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();

    return () => {
      // The opener may be gone (its booking was cancelled), so fall back to the page heading
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
      else heading?.focus();
    };
  }, [dialogOpen]);

  const selectFilter = (value: "all" | Status) => {
    if (value === filter && page === 1) return; // already showing this list, nothing to reload
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

  const openConfirm = (booking: Booking) => {
    setCancelError("");
    setConfirming(booking);
  };

  const confirmCancel = async () => {
    if (!confirming) return;

    try {
      setCancelling(true);
      setCancelError("");

      const { booking } = await callApi(`/api/bookings/${confirming.id}/cancel`, { method: "PATCH", forbiddenMessage });

      if (filter === "all") {
        // Same list, same page count: just update the card
        setBookings((list) => list.map((b) => (b.id === booking.id ? booking : b)));
      } else {
        // The booking no longer matches this filter: remove it
        setBookings((list) => list.filter((b) => b.id !== booking.id));
        setTotal((n) => n - 1);
      }
      setAttempt((n) => n + 1); // quiet reload so the stats, page count and page contents are correct
      setConfirming(null);
    } catch (err) {
      setCancelError(errorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  // Starts a Stripe Checkout. Only the booking id is sent: the amount and currency are read from the database by the
  // backend. This page never marks anything as paid; the backend does that after Stripe confirms the payment.
  const startPayment = async (id: string) => {
    if (payingId) return; // one request at a time
    setPayingId(id);
    setPayError(null);

    try {
      const { url } = await callApi("/api/payments/create-checkout-session", { method: "POST", body: { bookingId: id }, forbiddenMessage });
      if (!isStripeCheckoutUrl(url)) throw new Error("Could not start the payment. Please try again.");
      window.location.assign(url); // stay locked ("Redirecting...") while the browser leaves
    } catch (err) {
      setPayError({ id, message: errorMessage(err) });
      setPayingId("");
    }
  };

  let content: React.ReactNode;

  if (isPending) {
    content = <div className="h-40 animate-pulse rounded-2xl bg-gray-200" aria-busy="true" />;
  } else if (!session) {
    content = (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-gray-700">Please sign in to view your bookings.</p>
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/sign-in?redirect=/dashboard/my-bookings" className="rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600">
            Sign in
          </Link>
          <Link href="/sign-up" className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-800 transition hover:bg-gray-50">
            Create an account
          </Link>
        </div>
      </div>
    );
  } else if (!isCustomer) {
    content = (
      <p className="rounded-2xl bg-orange-50 p-6 text-sm font-medium text-orange-700">
        Only customer accounts can view bookings.
        {session.user.role && ` You are signed in as a ${session.user.role}.`}
      </p>
    );
  } else {
    content = (
      <>
        {counts && (
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5" aria-label="Booking statistics">
            {[
              { label: "Total Bookings", value: counts.total, style: "text-gray-900" },
              { label: "Pending", value: counts.requested, style: "text-orange-600" },
              { label: "Accepted", value: counts.accepted, style: "text-teal-700" },
              { label: "In Progress", value: counts.in_progress, style: "text-sky-700" },
              { label: "Completed", value: counts.completed, style: "text-green-700" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-600">{s.label}</p>
                <p className={`mt-1 text-3xl font-bold ${s.style}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Filter by status">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => selectFilter(f.value)}
              aria-pressed={filter === f.value}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                filter === f.value
                  ? "border-teal-700 bg-teal-700 text-white"
                  : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2" aria-busy="true">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-44 animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-medium text-red-600">{error}</p>
            <div className="mt-4 flex justify-center gap-3">
              <button onClick={retry} className="rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white transition hover:bg-orange-600">
                Try again
              </button>
              {error === SESSION_EXPIRED && (
                <Link href="/sign-in?redirect=/dashboard/my-bookings" className={buttonClass}>Sign in</Link>
              )}
            </div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-600">
            <p>
              {filter === "all"
                ? "You have no bookings yet."
                : `You have no ${statusLabel[filter].toLowerCase()} bookings.`}
            </p>
            {filter === "all" && (
              <Link href="/services" className="mt-4 inline-block font-semibold text-teal-700 hover:underline">
                Browse services →
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="mt-6 text-sm text-gray-600">
              {total} {total === 1 ? "booking" : "bookings"}
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {bookings.map((b) => (
                <article key={b.id} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{b.serviceTitle}</h3>
                      <p className="mt-1 text-sm text-gray-600">{b.category}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[b.status]}`}>
                      {statusLabel[b.status]}
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div>
                      <dt className="text-gray-500">Date</dt>
                      <dd className="font-medium text-gray-900">{formatDate(b.preferredDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Time</dt>
                      <dd className="font-medium text-gray-900">{b.preferredTime}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Technician</dt>
                      <dd className="font-medium text-gray-900">{b.technician}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Price</dt>
                      <dd className="font-medium text-gray-900">{usd(b.price)}</dd>
                    </div>
                    {b.finalAmount !== undefined && (
                      <div>
                        <dt className="text-gray-500">{b.paymentStatus === "paid" ? "Bill paid" : "Bill amount due"}</dt>
                        <dd className="font-medium text-gray-900">{usd(b.finalAmount)}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-gray-500">Payment</dt>
                      <dd className={`font-medium capitalize ${b.paymentStatus === "paid" ? "text-green-700" : "text-gray-900"}`}>
                        {b.paymentStatus}
                      </dd>
                    </div>
                  </dl>

                  {b.paymentStatus === "paid" && (
                    <div role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
                      <p className="font-semibold">
                        Payment confirmed{paidByBooking[b.id] ? ` · ${usdMoney(paidByBooking[b.id].amount)} ${paidByBooking[b.id].currency.toUpperCase()}` : ""}
                      </p>
                      {paidByBooking[b.id]?.paidAt && <p className="mt-1">Paid on {formatDateTime(paidByBooking[b.id].paidAt!)}</p>}
                      {paidByBooking[b.id]?.transactionId && (
                        <p className="mt-1 break-all">Transaction ID: {paidByBooking[b.id].transactionId}</p>
                      )}
                    </div>
                  )}

                  {b.status === "requested" && (
                    <button
                      onClick={() => openConfirm(b)}
                      className="mt-5 self-start rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      Cancel booking
                    </button>
                  )}

                  {/* Pay: only for completed bookings that are still unpaid. The backend decides the amount. */}
                  {b.status === "completed" && b.paymentStatus === "unpaid" && typeof b.finalAmount === "number" && (
                    <div className="mt-5">
                      <button
                        onClick={() => startPayment(b.id)}
                        disabled={payingId !== ""}
                        className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {payingId === b.id ? "Redirecting to payment..." : `Pay Now · ${usdMoney(b.finalAmount)}`}
                      </button>
                      {payError?.id === b.id && (
                        <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">{payError.message}</p>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>

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

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold text-gray-900 outline-none">My Bookings</h1>
      <p className="mt-2 mb-8 text-gray-600">Track and manage your repair requests.</p>

      {content}

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="cancel-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="cancel-title" className="text-lg font-bold text-gray-900">Cancel this booking?</h2>
            <p className="mt-2 text-sm text-gray-600">
              {confirming.serviceTitle} on {formatDate(confirming.preferredDate)}, {confirming.preferredTime}. This cannot be undone.
            </p>

            {cancelError && (
              <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">{cancelError}</p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button onClick={() => setConfirming(null)} disabled={cancelling} className={`${buttonClass} disabled:opacity-60`}>
                Keep booking
              </button>
              <button
                onClick={confirmCancel}
                disabled={cancelling}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelling ? "Cancelling..." : "Yes, cancel booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
