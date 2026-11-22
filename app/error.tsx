"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-6xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
      <p className="mt-2 text-gray-600">An unexpected error occurred. Please try again.</p>
      <button onClick={reset} className="mt-6 rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600">
        Try again
      </button>
    </main>
  );
}
