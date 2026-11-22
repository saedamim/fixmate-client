"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";

const links = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/#how-it-works", label: "How it works" },
];

const myBookingsLink = { href: "/dashboard/my-bookings", label: "My Bookings" };
const technicianLink = { href: "/dashboard/technician", label: "Technician Dashboard" };
const adminLink = { href: "/dashboard/admin", label: "Admin Dashboard" };

function WrenchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.1L3 17.7V21h3.3l6.3-6.3a4 4 0 0 0 5.1-5.4l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6Z" />
    </svg>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();

  // Extra link by role: "My Bookings" (customer), "Technician Dashboard" (technician), "Admin Dashboard" (admin)
  const roleLinks = { customer: myBookingsLink, technician: technicianLink, admin: adminLink };
  const roleLink = roleLinks[session?.user.role as keyof typeof roleLinks];

  // Signed out: only Home. Signed in: the main links plus the link for the user's role.
  const navLinks = session ? (roleLink ? [...links, roleLink] : links) : [links[0]];

  const handleLogout = async () => {
    setOpen(false);
    try {
      await signOut(); // updates useSession everywhere, so the Navbar changes straight away
    } finally {
      router.push("/");
      router.refresh();
    }
  };

  const isActive = (href: string) =>
    !href.includes("#") && (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const linkClass = (href: string) =>
    `text-sm font-medium transition hover:text-teal-700 ${
      isActive(href) ? "text-teal-700" : "text-gray-700"
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-teal-700">
          <WrenchIcon />
          <span>
            Fix<span className="text-orange-500">Mate</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`${linkClass(l.href)} border-b-2 py-5 ${isActive(l.href) ? "border-teal-700" : "border-transparent"}`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Nothing is shown while the session loads, so signed-in users never see a flash of Sign in / Sign up */}
        <div className="hidden items-center gap-3 md:flex">
          {isPending ? null : session ? (
            <>
              <span className="max-w-[10rem] truncate text-sm font-medium text-gray-800">Welcome, {session.user.name}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="text-sm font-semibold text-gray-800 hover:text-teal-700">
                Sign in
              </Link>
              <Link href="/sign-up" className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600">
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="rounded-lg border border-gray-300 p-2 text-gray-800 md:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-gray-200 bg-white px-4 py-4 md:hidden">
          <ul className="space-y-1">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                    isActive(l.href) ? "bg-teal-50 text-teal-700" : "text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          {isPending ? null : session ? (
            <div className="mt-4">
              <p className="truncate px-3 text-sm font-medium text-gray-800">Welcome, {session.user.name}</p>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 w-full rounded-lg border border-gray-300 py-2 text-center text-sm font-semibold text-gray-800"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link href="/sign-in" onClick={() => setOpen(false)} className="rounded-lg border border-gray-300 py-2 text-center text-sm font-semibold text-gray-800">
                Sign in
              </Link>
              <Link href="/sign-up" onClick={() => setOpen(false)} className="rounded-lg bg-orange-500 py-2 text-center text-sm font-semibold text-white">
                Sign up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
