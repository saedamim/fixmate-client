import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import ServiceCard from "@/components/site/ServiceCard";
import BookingActivityCard from "@/components/site/BookingActivityCard";
import { categories, features, getFeaturedServices, getRecentActivity, stats, steps, testimonials, type Service } from "@/lib/data/services";

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h2>
      <p className="mt-2 text-gray-600">{subtitle}</p>
    </div>
  );
}

const messageClass = "rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-600";

function FeaturedSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {[1, 2, 3].map((n) => (
        <div key={n} className="h-80 animate-pulse rounded-2xl bg-gray-100" />
      ))}
    </div>
  );
}

// Fetches from the backend API; shows an error or empty message instead of crashing the page
async function FeaturedServices() {
  await connection(); // fetch at request time, not while prerendering

  let featured: Service[];

  try {
    featured = await getFeaturedServices();
  } catch (error) {
    console.error("Could not load featured services:", error);
    return <p className={messageClass}>Featured services could not be loaded. Please try again later.</p>;
  }

  if (featured.length === 0) {
    return <p className={messageClass}>No featured services are available right now. Please check back soon.</p>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {featured.map((s) => (
        <ServiceCard key={s.id} service={s} />
      ))}
    </div>
  );
}

export default async function Home() {
  const activity = await getRecentActivity();

  return (
    <main>
      {/* Hero */}
      <section className="bg-linear-to-br from-teal-700 to-teal-900 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="mb-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              Home appliance repair, on demand
            </p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              Broken appliance? Get it fixed today.
            </h1>
            <p className="mt-4 max-w-lg text-teal-50">
              Book verified technicians for AC, refrigerator, washing machine and more. Transparent prices and a 30-day warranty.
            </p>
            <form action="/services" method="GET" role="search" className="mt-8 flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                name="search"
                required
                placeholder="Search e.g. AC repair, laptop, TV"
                aria-label="Search services"
                className="w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button type="submit" className="rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600">
                Search
              </button>
            </form>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link href="/services" className="rounded-lg border border-white/40 px-6 py-3 text-center font-semibold transition hover:bg-white/10">
                Browse services
              </Link>
              <Link href="#how-it-works" className="rounded-lg border border-white/40 px-6 py-3 text-center font-semibold transition hover:bg-white/10">
                How it works
              </Link>
            </div>
          </div>

          <BookingActivityCard items={activity} />

          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:col-span-2">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/10 p-4">
                <dt className="text-sm text-teal-100">{s.label}</dt>
                <dd className="mt-1 text-2xl font-bold">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading title="What do you need repaired?" subtitle="Choose a category to see available services." />
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
          {categories.map((c) => (
            <li key={c.name}>
              <Link
                href={`/services?category=${encodeURIComponent(c.name)}`}
                className="flex h-full flex-col items-center rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm transition hover:border-teal-600 hover:shadow-md"
              >
                <span className="text-3xl" aria-hidden>{c.icon}</span>
                <span className="mt-3 text-sm font-semibold text-gray-900">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Popular services */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading title="Featured services" subtitle="The latest approved services from trusted technicians." />
          <Suspense fallback={<FeaturedSkeleton />}>
            <FeaturedServices />
          </Suspense>
          <div className="mt-10 text-center">
            <Link href="/services" className="font-semibold text-teal-700 hover:underline">
              View all services →
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-16">
        <SectionHeading title="How FixMate works" subtitle="Three simple steps from broken to fixed." />
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{s.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Why FixMate */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading title="Why choose FixMate" subtitle="Repairs you can rely on." />
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <li key={f.title} className="rounded-2xl bg-[#f7f8f8] p-6">
                <span className="text-3xl" aria-hidden>{f.icon}</span>
                <h3 className="mt-3 font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{f.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading title="Loved by customers" subtitle="Real feedback from recent bookings." />
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-orange-500" aria-label={`${t.rating} out of 5 stars`}>
                {"★".repeat(t.rating)}
                <span className="text-gray-300">{"★".repeat(5 - t.rating)}</span>
              </p>
              <blockquote className="mt-3 text-sm text-gray-700">“{t.text}”</blockquote>
              <figcaption className="mt-4 text-sm">
                <span className="font-semibold text-gray-900">{t.name}</span>
                <span className="text-gray-500"> · {t.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-6xl rounded-3xl bg-teal-700 px-6 py-12 text-center text-white">
          <h2 className="text-2xl font-bold sm:text-3xl">Ready to fix it?</h2>
          <p className="mx-auto mt-2 max-w-md text-teal-50">Create a free account and book your first repair in minutes.</p>
          <Link href="/sign-up" className="mt-6 inline-block rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600">
            Get started
          </Link>
        </div>
      </section>
    </main>
  );
}
