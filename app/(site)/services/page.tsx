import Link from "next/link";
import ServiceCard from "@/components/site/ServiceCard";
import ServiceFilters from "@/components/site/ServiceFilters";
import { getServices } from "@/lib/data/services-api";
import { categories, serviceModes } from "@/lib/data/services";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

// Keep only plain string values from the URL
const first = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

export default async function ServicesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const search = first(params.search);
  const category = first(params.category);
  const mode = first(params.mode);
  const sort = first(params.sort) || "newest";

  const page = Math.max(parseInt(first(params.page)) || 1, 1);

  const { services, total, totalPages } = await getServices({ search, category, mode, sort, page });
  const hasFilters = Boolean(search || category || mode || sort !== "newest");

  // Link to another page of the same results (keeps the current search, filters and sort)
  const pageHref = (n: number) => {
    const query = new URLSearchParams();
    if (search) query.set("search", search);
    if (category) query.set("category", category);
    if (mode) query.set("mode", mode);
    if (sort !== "newest") query.set("sort", sort);
    if (n > 1) query.set("page", String(n));
    return `/services?${query}`;
  };
  const buttonClass =
    "rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50";

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Services</h1>
      <p className="mt-2 text-gray-600">Find a verified technician for your device or appliance.</p>

      <ServiceFilters
        categories={categories.map((c) => c.name)}
        modes={serviceModes}
        search={search}
        category={category}
        mode={mode}
        sort={sort}
        hasFilters={hasFilters}
      />

      <p className="mt-6 text-sm text-gray-600">
        {total} {total === 1 ? "service" : "services"} found
      </p>

      {services.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-600">
          No services match your search. Try different keywords or clear the filters.
        </p>
      ) : (
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-4">
          {page > 1 ? (
            <Link href={pageHref(Math.min(page - 1, totalPages))} className={buttonClass}>← Previous</Link>
          ) : (
            <span className={`${buttonClass} pointer-events-none opacity-40`}>← Previous</span>
          )}
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className={buttonClass}>Next →</Link>
          ) : (
            <span className={`${buttonClass} pointer-events-none opacity-40`}>Next →</span>
          )}
        </nav>
      )}
    </main>
  );
}
