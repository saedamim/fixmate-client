"use client";

import { toast } from "sonner";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { ApiError, callApi, errorMessage, SESSION_EXPIRED } from "@/lib/api";
import { celebrate } from "@/lib/confetti";
import { usdMoney } from "@/lib/currency";
import { formatDateTime, type Payment } from "@/lib/payments";

type Result =
  | { kind: "loading" }
  | { kind: "paid"; payment: Payment }
  | { kind: "pending" } // Stripe has not confirmed the payment (yet)
  | { kind: "error"; message: string };

const forbiddenMessage = "Only customer accounts can confirm a payment.";

const cardClass = "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8";
const primaryLink = "rounded-lg bg-orange-500 px-5 py-3 text-center font-semibold text-white transition hover:bg-orange-600";
const secondaryLink = "rounded-lg border border-gray-300 px-5 py-3 text-center font-semibold text-gray-800 transition hover:bg-gray-50";

function Links() {
  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
      <Link href="/dashboard/customer/payments" className={primaryLink}>Payment History</Link>
      <Link href="/dashboard/customer/bookings" className={secondaryLink}>My Bookings</Link>
    </div>
  );
}

// The URL only says which Checkout Session to look up. The payment counts as paid only when the backend,
// which asks Stripe itself, confirms it.
function Confirmation() {
  const sessionId = useSearchParams().get("session_id") ?? "";
  const { data: session, isPending } = useSession();
  const isCustomer = session?.user.role === "customer";

  const [result, setResult] = useState<Result>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0); // changes to check again

  useEffect(() => {
    if (!isCustomer || !sessionId) return;

    let ignore = false;
    callApi(`/api/payments/verify?session_id=${encodeURIComponent(sessionId)}`, { forbiddenMessage })
      .then((data) => {
        if (ignore) return;
        // Only an explicit "paid" record from the backend is shown as a success
        if (data.payment?.status === "paid") {
          setResult({ kind: "paid", payment: data.payment });
          toast.success("Payment confirmed. Thank you!");
          celebrate();
        } else setResult({ kind: "error", message: "We could not confirm this payment. Please check your payment history." });
      })
      .catch((err) => {
        if (ignore) return;
        // 402: the backend asked Stripe and the session is not paid
        if (err instanceof ApiError && err.status === 402) setResult({ kind: "pending" });
        else setResult({ kind: "error", message: errorMessage(err) });
      });

    return () => {
      ignore = true;
    };
  }, [isCustomer, sessionId, attempt]);

  const checkAgain = () => {
    setResult({ kind: "loading" });
    setAttempt((n) => n + 1);
  };

  if (isPending) return <div className="h-48 animate-pulse rounded-2xl bg-gray-200" aria-busy="true" />;

  if (!session) {
    const back = `/payment/success${sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ""}`;
    return (
      <div className={`${cardClass} text-center`}>
        <p className="text-gray-700">Please sign in to confirm your payment.</p>
        <Link href={`/sign-in?redirect=${encodeURIComponent(back)}`} className={`mt-5 inline-block ${primaryLink}`}>Sign in</Link>
      </div>
    );
  }

  if (!isCustomer) {
    return (
      <p className="rounded-2xl bg-orange-50 p-6 text-sm font-medium text-orange-700">
        {forbiddenMessage}
        {session.user.role && ` You are signed in as a ${session.user.role}.`}
      </p>
    );
  }

  if (!sessionId) {
    return (
      <div className={cardClass}>
        <h2 className="text-xl font-bold text-gray-900">We could not find your payment</h2>
        <p className="mt-2 text-gray-700">This page needs a payment reference. If you paid, your booking will show it as Paid once it is confirmed.</p>
        <Links />
      </div>
    );
  }

  if (result.kind === "loading") {
    return (
      <div className={cardClass} role="status" aria-busy="true">
        <div className="h-6 w-56 animate-pulse rounded bg-gray-200" />
        <p className="mt-4 text-gray-700">Confirming your payment with Stripe. Please do not close this page.</p>
        <div className="mt-4 h-20 animate-pulse rounded-lg bg-gray-100" />
      </div>
    );
  }

  if (result.kind === "paid") {
    const p = result.payment;
    return (
      <div className={cardClass}>
        <p role="status" className="rounded-lg bg-green-50 p-4 font-semibold text-green-800">Payment confirmed. Thank you!</p>
        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
          <div className="col-span-2">
            <dt className="text-gray-500">Service</dt>
            <dd className="font-medium text-gray-900">{p.serviceTitle}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Amount paid</dt>
            <dd className="font-medium text-gray-900">{usdMoney(p.amount)} <span className="text-xs font-normal text-gray-500">{p.currency.toUpperCase()}</span></dd>
          </div>
          <div>
            <dt className="text-gray-500">Paid on</dt>
            <dd className="font-medium text-gray-900">{p.paidAt ? formatDateTime(p.paidAt) : "—"}</dd>
          </div>
          {p.transactionId && (
            <div className="col-span-2">
              <dt className="text-gray-500">Transaction ID</dt>
              <dd className="break-all font-medium text-gray-900">{p.transactionId}</dd>
            </div>
          )}
        </dl>
        <Links />
      </div>
    );
  }

  if (result.kind === "pending") {
    return (
      <div className={cardClass}>
        <p role="status" className="rounded-lg bg-orange-50 p-4 font-semibold text-orange-700">Your payment has not been confirmed yet</p>
        <p className="mt-4 text-gray-700">
          Stripe has not reported this payment as completed. Nothing has been marked as paid. If you did pay, wait a moment and check again;
          your booking will show as Paid once it is confirmed.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button onClick={checkAgain} className={primaryLink}>Check again</button>
          <Link href="/dashboard/customer/bookings" className={secondaryLink}>My Bookings</Link>
          <Link href="/dashboard/customer/payments" className={secondaryLink}>Payment History</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <p role="alert" className="rounded-lg bg-red-50 p-4 font-medium text-red-600">{result.message}</p>
      <p className="mt-4 text-gray-700">Your booking is only marked as Paid after the payment is confirmed.</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button onClick={checkAgain} className={primaryLink}>Try again</button>
        {result.message === SESSION_EXPIRED && (
          <Link href={`/sign-in?redirect=${encodeURIComponent(`/payment/success?session_id=${sessionId}`)}`} className={secondaryLink}>Sign in</Link>
        )}
        <Link href="/dashboard/customer/bookings" className={secondaryLink}>My Bookings</Link>
        <Link href="/dashboard/customer/payments" className={secondaryLink}>Payment History</Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Payment</h1>
      {/* useSearchParams needs a Suspense boundary */}
      <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-gray-200" aria-busy="true" />}>
        <Confirmation />
      </Suspense>
    </main>
  );
}
