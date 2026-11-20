import Link from "next/link";
import { categories } from "@/lib/data/services";

// Placeholder contact details – replace with the real ones.
const contact = {
  email: "support@fixmate.com",
  phone: "+880 1700-000000",
  address: "Dhaka, Bangladesh",
  xUrl: "https://x.com",
};

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-bold text-teal-700">
            Fix<span className="text-orange-500">Mate</span>
          </p>
          <p className="mt-2 text-sm text-gray-600">Trusted device and appliance repair, booked in minutes.</p>
          <a
            href={contact.xUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="FixMate on X"
            className="mt-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-800 transition hover:border-teal-700 hover:text-teal-700"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M18.244 2H21.5l-7.1 8.12L22.75 22h-6.54l-5.12-6.7L5.23 22H1.97l7.6-8.68L1.5 2h6.7l4.63 6.12L18.244 2Zm-1.14 18h1.8L7.2 3.9H5.27L17.104 20Z" />
            </svg>
          </a>
        </div>

        <nav aria-label="Quick links">
          <h3 className="text-sm font-semibold text-gray-900">Quick links</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li><Link href="/" className="hover:text-teal-700">Home</Link></li>
            <li><Link href="/services" className="hover:text-teal-700">Services</Link></li>
            <li><Link href="/#how-it-works" className="hover:text-teal-700">How it works</Link></li>
            <li><Link href="/about" className="hover:text-teal-700">About</Link></li>
          </ul>
        </nav>

        <nav aria-label="Popular categories">
          <h3 className="text-sm font-semibold text-gray-900">Popular categories</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            {categories.map((c) => (
              <li key={c.name}>
                <Link href={`/services?category=${encodeURIComponent(c.name)}`} className="hover:text-teal-700">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="text-sm font-semibold text-gray-900">Contact</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li><a href={`mailto:${contact.email}`} className="hover:text-teal-700">{contact.email}</a></li>
            <li><a href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`} className="hover:text-teal-700">{contact.phone}</a></li>
            <li>{contact.address}</li>
          </ul>
        </div>
      </div>
      <p className="border-t border-gray-100 py-4 text-center text-xs text-gray-500">
        © 2026 FixMate. All rights reserved.
      </p>
    </footer>
  );
}
