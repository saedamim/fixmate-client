import Link from "next/link";

export default function ServiceNotFound() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Service not found</h1>
      <p className="mt-2 text-gray-600">This service does not exist or is not available.</p>
      <Link href="/services" className="mt-6 inline-block rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600">
        Browse services
      </Link>
    </main>
  );
}
