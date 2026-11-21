export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10" aria-busy="true">
      <div className="h-9 w-40 animate-pulse rounded bg-gray-200" />
      <div className="mt-8 h-40 animate-pulse rounded-2xl bg-gray-200 lg:h-24" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-72 animate-pulse rounded-2xl bg-gray-200" />
        ))}
      </div>
    </main>
  );
}
