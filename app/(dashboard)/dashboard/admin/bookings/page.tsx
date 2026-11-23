"use client";

import { formatDate, statusLabel, statusStyle } from "@/lib/bookings";
import { bookingOptions, type AdminBooking } from "@/lib/admin";
import { usd } from "@/lib/currency";
import RoleGate from "@/components/dashboard/RoleGate";
import { PagedList } from "@/components/dashboard/PagedList";

function BookingRows({ bookings }: { bookings: AdminBooking[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {bookings.map((b) => (
        <article key={b.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-gray-900">{b.serviceTitle}</h3>
              <p className="mt-1 text-sm text-gray-600">{b.customerName} → {b.technician}</p>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[b.status]}`}>
              {statusLabel[b.status]}
            </span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Date</dt>
              <dd className="font-medium text-gray-900">{formatDate(b.preferredDate)}, {b.preferredTime}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{b.finalAmount !== undefined ? "Final amount" : "Price"}</dt>
              <dd className="font-medium text-gray-900">{usd(b.finalAmount ?? b.price)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Payment</dt>
              <dd className="font-medium capitalize text-gray-900">{b.paymentStatus}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}

export default function AdminBookingsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">All Bookings</h1>
      <p className="mt-2 mb-8 text-gray-600">Every repair job on the platform (read only).</p>

      <RoleGate role="admin" action="view bookings" signInPath="/dashboard/admin/bookings">
        {() => (
          <PagedList<AdminBooking> path="/api/admin/bookings" filterName="status" options={bookingOptions} noun="bookings" signInPath="/dashboard/admin/bookings" render={(bookings) => <BookingRows bookings={bookings} />} />
        )}
      </RoleGate>
    </main>
  );
}
