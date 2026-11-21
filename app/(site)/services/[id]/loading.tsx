export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10" aria-busy="true">
      <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl bg-gray-200 sm:h-96" />
        <div className="space-y-4">
          <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
          <div className="h-9 w-3/4 animate-pulse rounded bg-gray-200" />
          <div className="h-24 animate-pulse rounded bg-gray-200" />
          <div className="h-40 animate-pulse rounded-2xl bg-gray-200" />
        </div>
      </div>
    </main>
  );
}
