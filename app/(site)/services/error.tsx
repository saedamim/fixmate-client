"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Could not load services</h1>
      <p className="mt-2 text-gray-600">Something went wrong. Please try again.</p>
      <button onClick={reset} className="mt-6 rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600">
        Try again
      </button>
    </main>
  );
}
