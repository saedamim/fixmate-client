import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-6xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-2 text-gray-600">The page you are looking for does not exist.</p>
      <Link href="/" className="mt-6 inline-block rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600">
        Go home
      </Link>
    </main>
  );
}
