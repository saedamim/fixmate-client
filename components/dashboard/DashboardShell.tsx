"use client";

import { toast } from "sonner";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";

type IconName = "home" | "grid" | "calendar" | "card" | "plus" | "wrench" | "inbox" | "users" | "box" | "receipt" | "user";

type NavItem = {
  label: string;
  href: string;
  icon: IconName;
  exact?: boolean; // a section's root page is only active on that exact path
  aliases?: string[]; // other URLs of the same page that also highlight this item
  exists: boolean; // false: the page is not built yet, so the item is shown disabled (no link, no fake page)
};

// What each role sees. The role always comes from the signed-in session, never from the client.
const roleNav: Record<string, NavItem[]> = {
  customer: [
    { label: "Overview", href: "/dashboard/customer", icon: "grid", exact: true, exists: true },
    { label: "My Bookings", href: "/dashboard/customer/bookings", icon: "calendar", aliases: ["/dashboard/my-bookings"], exists: true },
    { label: "Payment History", href: "/dashboard/customer/payments", icon: "card", exists: true },
  ],
  technician: [
    { label: "Dashboard", href: "/dashboard/technician", icon: "grid", exact: true, exists: true },
    { label: "Add Service", href: "/dashboard/technician/add-service", icon: "plus", exists: true },
    { label: "My Services", href: "/dashboard/technician/my-services", icon: "wrench", exists: true },
    { label: "Requests", href: "/dashboard/technician/requests", icon: "inbox", exists: true },
  ],
  admin: [
    { label: "Dashboard", href: "/dashboard/admin", icon: "grid", exact: true, exists: true },
    { label: "Manage Users", href: "/dashboard/admin/users", icon: "users", exists: false },
    { label: "Manage Services", href: "/dashboard/admin/services", icon: "box", exists: false },
    { label: "Manage Bookings", href: "/dashboard/admin/bookings", icon: "calendar", exists: false },
    { label: "Transactions", href: "/dashboard/admin/transactions", icon: "receipt", exists: true },
  ],
};

const commonNav: NavItem[] = [
  { label: "Update Profile", href: "/dashboard/profile", icon: "user", exists: true },
  { label: "Back to site", href: "/", icon: "home", exact: true, exists: true },
];

const iconPaths: Record<IconName, string> = {
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  card: "M3 6h18v12H3zM3 10h18M7 15h4",
  plus: "M12 5v14M5 12h14",
  wrench: "M14.7 6.3a4 4 0 0 0-5.4 5.1L3 17.7V21h3.3l6.3-6.3a4 4 0 0 0 5.1-5.4l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6Z",
  inbox: "M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M17 4a4 4 0 0 1 0 7M22 21a7 7 0 0 0-4-6.3",
  box: "M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
};

function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={iconPaths[name]} />
    </svg>
  );
}

const roleLabel: Record<string, string> = { customer: "Customer", technician: "Technician", admin: "Admin" };

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false); // desktop: icons only
  const [mobileOpen, setMobileOpen] = useState(false); // mobile: off-canvas sidebar

  const user = session?.user;
  const role = user?.role ?? "";
  const items = [...(roleNav[role] ?? []), ...(user ? commonNav : commonNav.slice(1))];

  // Escape closes the mobile sidebar
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const isActive = (item: NavItem) =>
    [item.href, ...(item.aliases ?? [])].some((href) =>
      item.exact ? pathname === href : pathname === href || pathname.startsWith(href + "/")
    );

  const handleLogout = async () => {
    try {
      await signOut(); // the existing Better Auth sign out
      toast.success("You have been signed out.");
    } finally {
      router.push("/");
      router.refresh();
    }
  };

  const labelClass = collapsed ? "md:hidden" : ""; // labels are hidden only on a collapsed desktop sidebar

  const itemClass = (active: boolean) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${collapsed ? "md:justify-center md:px-0" : ""} ${
      active ? "bg-teal-50 text-teal-700" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
    }`;

  return (
    <div className="flex min-h-screen flex-1 bg-[#f7f8f8]">
      {/* Mobile backdrop: clicking it closes the sidebar */}
      {mobileOpen && <div className="fixed inset-0 z-30 bg-gray-900/40 md:hidden" onClick={() => setMobileOpen(false)} aria-hidden />}

      <aside
        id="dashboard-sidebar"
        aria-label="Dashboard"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-[transform,width,visibility] duration-200 ease-out md:sticky md:top-0 md:h-screen md:translate-x-0 md:shrink-0 md:visible ${
          collapsed ? "md:w-[4.5rem]" : "md:w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full max-md:invisible"}`}
      >
        <div className={`flex h-16 shrink-0 items-center border-b border-gray-200 px-4 ${collapsed ? "md:justify-center md:px-0" : ""}`}>
          <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-xl font-bold text-teal-700" aria-label="FixMate home">
            <Icon name="wrench" className="h-6 w-6 shrink-0" />
            <span className={labelClass}>
              Fix<span className="text-orange-500">Mate</span>
            </span>
          </Link>
        </div>

        <nav aria-label="Dashboard navigation" className="flex-1 overflow-y-auto p-3">
          {isPending ? (
            <div className="space-y-2" aria-busy="true">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-10 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : (
            <ul className="space-y-1">
              {items.map((item, index) => {
                const active = item.exists && isActive(item);
                const divider = index > 0 && item.href === "/dashboard/profile"; // separates the common links
                return (
                  <li key={item.href} className={divider ? "mt-3 border-t border-gray-100 pt-3" : ""}>
                    {item.exists ? (
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        aria-current={active ? "page" : undefined}
                        title={collapsed ? item.label : undefined}
                        className={itemClass(active)}
                      >
                        <Icon name={item.icon} className="h-5 w-5 shrink-0" />
                        <span className={labelClass}>{item.label}</span>
                      </Link>
                    ) : (
                      <span
                        aria-disabled="true"
                        title={`${item.label} (coming soon)`}
                        className={`flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 ${collapsed ? "md:justify-center md:px-0" : ""}`}
                      >
                        <Icon name={item.icon} className="h-5 w-5 shrink-0" />
                        <span className={`${labelClass} flex-1`}>{item.label}</span>
                        <span className={`${labelClass} rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-gray-500`}>Soon</span>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white/90 px-4 backdrop-blur">
          {/* One toggle per screen size: opens the sidebar on mobile, collapses it on desktop */}
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="dashboard-sidebar"
            className="rounded-lg border border-gray-300 p-2 text-gray-800 transition hover:bg-gray-50 md:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              {mobileOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            aria-controls="dashboard-sidebar"
            className="hidden rounded-lg border border-gray-300 p-2 text-gray-800 transition hover:bg-gray-50 md:inline-flex"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 5h16v14H4zM9 5v14" />
              <path d={collapsed ? "M13 9l3 3-3 3" : "M16 9l-3 3 3 3"} />
            </svg>
          </button>

          <div className="ml-auto flex min-w-0 items-center gap-3">
            {isPending ? null : user ? (
              <>
                <div className="flex min-w-0 items-center gap-3">
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.image} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-semibold text-white" aria-hidden>
                      {(user.name || user.email || "?").trim().charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="hidden min-w-0 leading-tight sm:block">
                    <p className="max-w-[12rem] truncate text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-600">{roleLabel[role] ?? role}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/sign-in" className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600">
                Sign in
              </Link>
            )}
          </div>
        </header>

        {/* Each page renders its own <main> */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
