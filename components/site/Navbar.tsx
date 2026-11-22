"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import Avatar from "./Avatar";

const links = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/#how-it-works", label: "How it works" },
];

// Account menu (avatar dropdown). Customers get their dashboard pages here instead of separate navbar buttons.
const customerMenu = [
  { href: "/dashboard/customer/bookings", label: "My Bookings" },
  { href: "/dashboard/customer/payments", label: "Payment History" },
  { href: "/dashboard/profile", label: "Update Profile" },
];
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

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Technicians and admins keep their dashboard link in the navbar; customers use the avatar menu instead
  const role = session?.user.role;
  const roleLink = role === "technician" ? technicianLink : role === "admin" ? adminLink : null;
  const accountLinks = role === "customer" ? customerMenu : roleLink ? [roleLink] : [];

  // Signed out: only Home. Signed in: the main links plus the dashboard link for technician/admin.
  const navLinks = session ? (roleLink ? [...links, roleLink] : links) : [links[0]];

  // The avatar menu closes on Escape or a click outside it
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    const onClick = (e: MouseEvent) => menuRef.current && !menuRef.current.contains(e.target as Node) && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    setOpen(false);
    setMenuOpen(false);
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
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-2 rounded-full p-0.5 transition hover:ring-2 hover:ring-teal-100"
              >
                <Avatar name={session.user.name} src={session.user.image} size={36} />
              </button>
              {menuOpen && (
                <div role="menu" className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
                  <div className="border-b border-gray-100 px-4 pb-2">
                    <p className="truncate text-sm font-semibold text-gray-900">{session.user.name}</p>
                    <p className="truncate text-xs text-gray-600">{session.user.email}</p>
                  </div>
                  {accountLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 hover:text-teal-700"
                    >
                      {l.label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className={`block w-full px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-gray-50 ${accountLinks.length ? "mt-1 border-t border-gray-100" : ""}`}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
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
              <div className="flex items-center gap-3 px-3">
                <Avatar name={session.user.name} src={session.user.image} size={32} />
                <p className="truncate text-sm font-medium text-gray-800">{session.user.name}</p>
              </div>
              {role === "customer" && (
                <ul className="mt-2 space-y-1">
                  {customerMenu.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 w-full rounded-lg border border-gray-300 py-2 text-center text-sm font-semibold text-red-600"
              >
                Sign Out
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
