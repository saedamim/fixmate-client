import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About | FixMate",
  description: "FixMate connects customers with trusted technicians for device and appliance repair.",
};

const values = [
  { title: "Trusted technicians", text: "Every service is listed by a technician and approved by an admin before customers can book it." },
  { title: "Clear pricing", text: "See the price up front, then pay securely online once the work is done." },
  { title: "Simple booking", text: "Pick a service, choose a date and time, and follow the request from your dashboard." },
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900">About FixMate</h1>
      <p className="mt-3 max-w-2xl text-gray-600">
        FixMate is a repair marketplace. Customers book phone, laptop and home appliance repairs, technicians manage their
        services and requests, and admins keep the platform safe and organised.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-3">
        {values.map((v) => (
          <li key={v.title} className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="font-semibold text-teal-700">{v.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{v.text}</p>
          </li>
        ))}
      </ul>
      <Link href="/services" className="mt-8 inline-block rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600">
        Browse services
      </Link>
    </main>
  );
}
