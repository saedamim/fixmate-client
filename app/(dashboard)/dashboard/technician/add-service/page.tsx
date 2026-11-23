"use client";

import { useState } from "react";
import Link from "next/link";
import ServiceForm from "@/components/site/ServiceForm";
import RoleGate from "@/components/dashboard/RoleGate";

function AddServiceForm() {
  const [success, setSuccess] = useState("");
  const [formKey, setFormKey] = useState(0); // a new key gives an empty form for "Add another"

  if (!success) return <ServiceForm key={formKey} onSaved={setSuccess} />;

  return (
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
}

export default function AddServicePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/dashboard/technician" className="text-sm font-semibold text-teal-700 hover:underline">← Technician Dashboard</Link>
      <h1 className="mt-4 text-3xl font-bold text-gray-900">Add Service</h1>
      <p className="mt-2 mb-8 text-gray-600">Offer a new repair service to customers.</p>

      <RoleGate role="technician" action="add services" signInPath="/dashboard/technician/add-service">
        {() => <AddServiceForm />}
      </RoleGate>
    </main>
  );
}
