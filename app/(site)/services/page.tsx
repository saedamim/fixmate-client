import Link from "next/link";
import ServiceCard from "@/components/site/ServiceCard";
import { categories, getServices, serviceModes } from "@/lib/data/services";

const selectClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm font-medium text-gray-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

// Keep only plain string values from the URL
const first = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

export default async function ServicesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const search = first(params.search);
  const category = first(params.category);
  const mode = first(params.mode);
  const sort = first(params.sort) || "newest";

  const services = await getServices({ search, category, mode, sort });
  const hasFilters = Boolean(search || category || mode || sort !== "newest");

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Services</h1>
      <p className="mt-2 text-gray-600">Find a verified technician for your device or appliance.</p>

      <form action="/services" method="GET" className="mt-8 grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <input
          type="search"
          name="search"
          defaultValue={search}
          placeholder="Search services"
          aria-label="Search services"
          className={`${selectClass} placeholder:text-gray-500 lg:col-span-2`}
        />
        <select name="category" defaultValue={category} aria-label="Category" className={selectClass}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>
        <select name="mode" defaultValue={mode} aria-label="Service mode" className={selectClass}>
          <option value="">All modes</option>
          {serviceModes.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select name="sort" defaultValue={sort} aria-label="Sort by" className={selectClass}>
          <option value="newest">Newest first</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>

        <div className="flex gap-3 sm:col-span-2 lg:col-span-5">
          <button type="submit" className="rounded-lg bg-orange-500 px-6 py-2.5 font-semibold text-white transition hover:bg-orange-600">
            Apply
          </button>
          {hasFilters && (
            <Link href="/services" className="rounded-lg border border-gray-300 px-6 py-2.5 font-semibold text-gray-800 transition hover:bg-gray-50">
              Clear
            </Link>
          )}
        </div>
      </form>

      <p className="mt-6 text-sm text-gray-600">
        {services.length} {services.length === 1 ? "service" : "services"} found
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
    </main>
  );
}
