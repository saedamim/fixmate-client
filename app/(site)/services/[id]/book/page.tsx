import Link from "next/link";
import { notFound } from "next/navigation";
import BookingForm from "@/components/site/BookingForm";
import { categoryIcon, getServiceById } from "@/lib/data/services";
import { usd } from "@/lib/currency";

// Booking page: the selected service summary and the booking form.
// Signed-out visitors are sent to Sign In (and back here) by proxy.ts.
export default async function BookServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = await getServiceById(id);

  if (!service) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href={`/services/${service.id}`} className="text-sm font-semibold text-teal-700 hover:underline">
        ← Back to service details
      </Link>

      <div className="mt-6 flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4">
        {service.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={service.imageUrl} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-4xl" aria-hidden>
            {categoryIcon(service.category)}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900">{service.title}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {service.category} · {service.mode} · {service.technician}
          </p>
          <p className="mt-1 text-lg font-bold text-gray-900">Starting at {usd(service.price)}</p>
        </div>
      </div>

      {service.available ? (
        <BookingForm serviceId={service.id} mode={service.mode} />
      ) : (
        <p className="mt-8 rounded-lg bg-gray-100 px-6 py-3 text-center font-semibold text-gray-600">
          Currently unavailable
        </p>
      )}
    </main>
  );
}
