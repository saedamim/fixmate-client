"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";

// "Book This Service" for customers (and signed-out visitors, who are sent to Sign In first).
// Technicians and admins provide or manage services, so they see a note instead of a booking button.
export default function BookServiceButton({ serviceId }: { serviceId: string }) {
  const { data: session, isPending } = useSession();

  if (isPending) return <div className="mt-6 h-[52px] animate-pulse rounded-lg bg-gray-200" aria-busy="true" />;

  if (session && session.user.role !== "customer") {
    return (
      <p className="mt-6 rounded-lg bg-gray-100 px-6 py-3 text-center text-sm font-semibold text-gray-700">
        Booking is only available to customer accounts.
      </p>
    );
  }

  return (
    <Link
      href={`/services/${serviceId}/book`}
      className="mt-6 block rounded-lg bg-orange-500 px-6 py-3 text-center text-lg font-semibold text-white transition hover:bg-orange-600"
    >
      Book This Service
    </Link>
  );
}
