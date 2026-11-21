"use client";

import Link from "next/link";

const fieldClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm font-medium text-gray-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

type Props = {
  categories: string[];
  modes: string[];
  search: string;
  category: string;
  mode: string;
  sort: string;
  hasFilters: boolean;
};

export default function ServiceFilters({ categories, modes, search, category, mode, sort, hasFilters }: Props) {
  return (
    <form
      action="/services"
      method="GET"
      // Dropdowns apply immediately; the search box is submitted with Enter or Apply
      onChange={(e) => {
        if (e.target instanceof HTMLSelectElement) e.currentTarget.requestSubmit();
      }}
      className="mt-8 grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
    >
      <input
        type="search"
        name="search"
        defaultValue={search}
        placeholder="Search services"
        aria-label="Search services"
        className={`${fieldClass} placeholder:text-gray-500 lg:col-span-2`}
      />
      <select name="category" defaultValue={category} aria-label="Category" className={fieldClass}>
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select name="mode" defaultValue={mode} aria-label="Service mode" className={fieldClass}>
        <option value="">All modes</option>
        {modes.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <select name="sort" defaultValue={sort} aria-label="Sort by" className={fieldClass}>
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
  );
}
