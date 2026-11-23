"use client";

import { toast } from "sonner";
import { useState } from "react";
import { callApi, errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/bookings";
import { roleOptions, type AdminUser } from "@/lib/admin";
import RoleGate from "@/components/dashboard/RoleGate";
import { PagedList, forbiddenMessage } from "@/components/dashboard/PagedList";

const roles = ["customer", "technician", "admin"] as const;

// Admin: change a user's role. The backend refuses invalid roles, your own account and the last admin;
// this page only shows the result. Role changes apply after the user's next sign-in: the API checks the role in the
// database on every request, but that user's menus and dashboards update when they sign in again.
function UserRows({ users, reload, currentUserId }: { users: AdminUser[]; reload: () => void; currentUserId: string }) {
  const [busyId, setBusyId] = useState("");
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(null);

  // The API refuses invalid roles, your own account and the last admin; its message is shown here
  const changeRole = async (id: string, role: string) => {
    try {
      setBusyId(id);
      setActionError(null);
      await callApi(`/api/admin/users/${id}/role`, { method: "PATCH", body: { role }, forbiddenMessage });
      toast.success(`Role changed to ${role}.`);
      reload();
    } catch (err) {
      setActionError({ id, message: errorMessage(err) });
      toast.error(errorMessage(err));
    } finally {
      setBusyId("");
    }
  };

  return (
    <ul className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white shadow-sm">
      {users.map((u) => (
        <li key={u.id} className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900">{u.name}</p>
              <p className="break-all text-sm text-gray-600">{u.email}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <label className="sr-only" htmlFor={`role-${u.id}`}>Role for {u.name}</label>
              <select
                id={`role-${u.id}`}
                value={u.role}
                disabled={busyId === u.id || u.id === currentUserId}
                onChange={(e) => changeRole(u.id, e.target.value)}
                title={u.id === currentUserId ? "You cannot change your own role" : undefined}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 capitalize text-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <span className={`rounded-full px-3 py-1 ${u.emailVerified ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                {u.emailVerified ? "Verified" : "Not verified"}
              </span>
              <span className="text-gray-500">Joined {formatDate(u.createdAt.slice(0, 10))}</span>
            </div>
          </div>
          {actionError?.id === u.id && (
            <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">{actionError.message}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function AdminUsersPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
      <p className="mt-2 mb-8 text-gray-600">Change a user&apos;s role. You cannot change your own role.</p>

      <RoleGate role="admin" action="manage users" signInPath="/dashboard/admin/users">
        {(user) => (
          <PagedList<AdminUser> path="/api/admin/users" filterName="role" options={roleOptions} noun="users" signInPath="/dashboard/admin/users" render={(users, reload) => <UserRows users={users} reload={reload} currentUserId={user.id} />} />
        )}
      </RoleGate>
    </main>
  );
}
