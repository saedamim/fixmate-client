import Link from "next/link";

// Stripe sends the customer here when they leave Checkout without paying. Nothing is changed or checked on this page.
export default function PaymentCancelPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Payment cancelled</h1>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <p role="status" className="rounded-lg bg-orange-50 p-4 font-semibold text-orange-700">Checkout was cancelled</p>
        <p className="mt-4 text-gray-700">
          You left the payment page, so you have not been charged and your booking is still unpaid. You can pay whenever you are ready.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/dashboard/customer/bookings" className="rounded-lg bg-orange-500 px-5 py-3 text-center font-semibold text-white transition hover:bg-orange-600">
            Back to My Bookings
          </Link>
          <Link href="/dashboard/customer/payments" className="rounded-lg border border-gray-300 px-5 py-3 text-center font-semibold text-gray-800 transition hover:bg-gray-50">
            Payment History
          </Link>
        </div>
      </div>
    </main>
  );
}
