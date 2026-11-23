import Link from "next/link";
import { notFound } from "next/navigation";
import { categoryIcon, getServiceById, type ServiceMode } from "@/lib/data/services";
import BookServiceButton from "@/components/site/BookServiceButton";
import { usd } from "@/lib/currency";

const modeHelp: Record<ServiceMode, string> = {
  "On-site": "The technician visits your home.",
  "In-shop": "You drop the device at the technician's shop.",
  "Pickup & Drop": "The device is picked up and returned to you.",
};

export default async function ServiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = await getServiceById(id);

  if (!service) notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/services" className="text-sm font-semibold text-teal-700 hover:underline">
        ← Back to services
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        {service.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={service.imageUrl} alt={service.title} className="h-72 w-full rounded-2xl object-cover sm:h-96" />
        ) : (
          <div className="flex h-72 items-center justify-center rounded-2xl bg-teal-50 text-8xl sm:h-96" aria-hidden>
            {categoryIcon(service.category)}
          </div>
        )}

        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="rounded-full bg-teal-50 px-3 py-1 text-teal-700">{service.category}</span>
            <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-600">{service.mode}</span>
          </div>

          <h1 className="mt-4 text-3xl font-bold text-gray-900">{service.title}</h1>
          <p className="mt-4 text-gray-700">{service.description}</p>

          <dl className="mt-6 divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white text-sm">
            <div className="flex justify-between gap-4 p-4">
              <dt className="text-gray-600">Starting price</dt>
              <dd className="text-2xl font-bold text-gray-900">{usd(service.price)}</dd>
            </div>
            <div className="flex justify-between gap-4 p-4">
              <dt className="text-gray-600">Service mode</dt>
              <dd className="text-right font-medium text-gray-900">
                {service.mode}
                <span className="block text-xs font-normal text-gray-600">{modeHelp[service.mode]}</span>
              </dd>
            </div>
            <div className="flex justify-between gap-4 p-4">
              <dt className="text-gray-600">Technician</dt>
              <dd className="font-medium text-gray-900">{service.technician}</dd>
            </div>
          </dl>

          {service.available ? (
            <BookServiceButton serviceId={service.id} />
          ) : (
            <p className="mt-6 rounded-lg bg-gray-100 px-6 py-3 text-center font-semibold text-gray-600">
              Currently unavailable
            </p>
          )}
        </div>
      </div>

    </main>
  );
}
