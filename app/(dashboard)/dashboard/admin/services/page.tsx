"use client";

import { toast } from "sonner";
import { useState } from "react";
import { callApi, errorMessage } from "@/lib/api";
import type { Service } from "@/lib/data/services";
import { serviceOptions, serviceStatusStyle } from "@/lib/admin";
import { usd } from "@/lib/currency";
import RoleGate from "@/components/dashboard/RoleGate";
import { PagedList, forbiddenMessage } from "@/components/dashboard/PagedList";

const actionClass = "rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

function ServiceRows({ services, reload }: { services: Service[]; reload: () => void }) {
  const [busyId, setBusyId] = useState("");
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(null);

  const setStatus = async (id: string, status: Service["status"]) => {
    try {
      setBusyId(id);
      setActionError(null);
      await callApi(`/api/admin/services/${id}/status`, { method: "PATCH", body: { status }, forbiddenMessage });
      toast.success(`Service ${status}.`);
      reload();
    } catch (err) {
      setActionError({ id, message: errorMessage(err) });
      toast.error(errorMessage(err));
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {services.map((s) => (
        <article key={s.id} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-gray-900">{s.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{s.category} · {s.mode}</p>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${serviceStatusStyle[s.status]}`}>
              {s.status}
            </span>
          </div>
          <p className="mt-3 text-sm text-gray-700">By {s.technician} · From {usd(s.price)}</p>

          <div className="mt-4 flex gap-3">
            {s.status !== "approved" && (
              <button onClick={() => setStatus(s.id, "approved")} disabled={busyId === s.id} className={`${actionClass} bg-teal-700 text-white hover:bg-teal-800`}>
                Approve
              </button>
            )}
            {s.status !== "rejected" && (
              <button onClick={() => setStatus(s.id, "rejected")} disabled={busyId === s.id} className={`${actionClass} border border-red-300 text-red-600 hover:bg-red-50`}>
                Reject
              </button>
            )}
          </div>

          {actionError?.id === s.id && (
            <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">{actionError.message}</p>
          )}
        </article>
      ))}
    </div>
  );
}

export default function AdminServicesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Service Approval</h1>
      <p className="mt-2 mb-8 text-gray-600">Approve or reject the services technicians submit. Pending services are shown first.</p>

      <RoleGate role="admin" action="manage services" signInPath="/dashboard/admin/services">
        {() => (
          <PagedList<Service> path="/api/admin/services" filterName="status" options={serviceOptions} initialFilter="pending" noun="services" signInPath="/dashboard/admin/services" render={(services, reload) => <ServiceRows services={services} reload={reload} />} />
        )}
      </RoleGate>
    </main>
  );
}
