import ServiceCard from "@/components/site/ServiceCard";
import ServiceFilters from "@/components/site/ServiceFilters";
import { categories, getServices, serviceModes } from "@/lib/data/services";

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
