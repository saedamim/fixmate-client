"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import ServiceForm from "@/components/site/ServiceForm";

export default function AddServicePage() {
  const { data: session, isPending } = useSession();
  const [success, setSuccess] = useState("");
  const [formKey, setFormKey] = useState(0); // a new key gives an empty form for "Add another"

  let content: React.ReactNode;

  if (isPending) {
    content = <div className="h-40 animate-pulse rounded-2xl bg-gray-200" aria-busy="true" />;
  } else if (!session) {
    content = (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-gray-700">Please sign in with a technician account to add a service.</p>
        <Link href="/sign-in?redirect=/dashboard/technician/add-service" className="mt-5 inline-block rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600">
          Sign in
        </Link>
      </div>
    );
  } else if (session.user.role !== "technician") {
    content = (
      <p className="rounded-2xl bg-orange-50 p-6 text-sm font-medium text-orange-700">
        Only technician accounts can add services.
        {session.user.role && ` You are signed in as a ${session.user.role}.`}
      </p>
    );
  } else if (success) {
    content = (
      <div role="status" className="rounded-2xl bg-green-50 p-6 text-green-800">
        <p className="text-lg font-semibold">{success}</p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
          <Link href="/dashboard/technician/my-services" className="underline">View my services</Link>
          <button
            onClick={() => {
              setSuccess("");
              setFormKey((n) => n + 1);
            }}
            className="underline"
          >
            Add another service
          </button>
        </div>
      </div>
    );
  } else {
    content = <ServiceForm key={formKey} onSaved={setSuccess} />;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/dashboard/technician" className="text-sm font-semibold text-teal-700 hover:underline">← Technician Dashboard</Link>
      <h1 className="mt-4 text-3xl font-bold text-gray-900">Add Service</h1>
      <p className="mt-2 mb-8 text-gray-600">Offer a new repair service to customers.</p>
      {content}
    </main>
  );
}
