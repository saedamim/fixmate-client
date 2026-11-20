import Link from "next/link";
import { categoryIcon, type Service } from "@/lib/data/services";

export default function ServiceCard({ service }: { service: Service }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      {service.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={service.imageUrl} alt={service.title} className="h-40 w-full object-cover" />
      ) : (
        <div className="flex h-40 items-center justify-center bg-teal-50 text-5xl" aria-hidden>
          {categoryIcon(service.category)}
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="rounded-full bg-teal-50 px-3 py-1 text-teal-700">{service.category}</span>
          <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-600">{service.mode}</span>
        </div>
        <h3 className="mt-3 text-lg font-semibold text-gray-900">{service.title}</h3>
        <p className="mt-1 text-sm text-gray-600">By {service.technician}</p>

        <div className="mt-auto flex items-center justify-between pt-5">
          <p className="text-sm text-gray-600">
            From <span className="text-lg font-bold text-gray-900">${service.price}</span>
          </p>
          <Link href={`/services/${service.id}`} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800">
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
