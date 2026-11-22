export default function Loading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10" aria-busy="true">
      <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
      <div className="mt-6 h-28 animate-pulse rounded-2xl bg-gray-200" />
      <div className="mt-8 h-96 animate-pulse rounded-2xl bg-gray-200" />
    </main>
  );
}
