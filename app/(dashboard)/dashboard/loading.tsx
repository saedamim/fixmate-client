// Shown inside the dashboard layout while a dashboard page loads (the sidebar and top bar stay in place)
export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-64 animate-pulse rounded-lg bg-gray-200" />
      <div className="mt-3 mb-8 h-5 w-96 max-w-full animate-pulse rounded-lg bg-gray-200" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-28 animate-pulse rounded-2xl bg-gray-200" />
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {[1, 2].map((n) => (
          <div key={n} className="h-44 animate-pulse rounded-2xl bg-gray-200" />
        ))}
      </div>
    </main>
  );
}
