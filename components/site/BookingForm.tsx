"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient, useSession } from "@/lib/auth-client";
import { API_URL, type ServiceMode } from "@/lib/data/services";

const TIME_SLOTS = ["09:00-12:00", "12:00-15:00", "15:00-18:00"];

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 placeholder:text-gray-500 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

type Fields = {
  preferredDate: string;
  preferredTime: string;
  phone: string;
  address: string;
  problemDescription: string;
};
type Errors = Partial<Record<keyof Fields, string>>;

const emptyFields: Fields = { preferredDate: "", preferredTime: "", phone: "", address: "", problemDescription: "" };

// Today's date in the user's timezone, as YYYY-MM-DD
const today = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

// Same rules as the backend, so most mistakes are caught before sending
function validate(fields: Fields, needsAddress: boolean): Errors {
  const errors: Errors = {};
  if (!fields.preferredDate) errors.preferredDate = "Please choose a date";
  else if (fields.preferredDate < today()) errors.preferredDate = "The date cannot be in the past";
  if (!TIME_SLOTS.includes(fields.preferredTime)) errors.preferredTime = "Please choose a time slot";
  if (!/^\+?[\d\s-]{7,20}$/.test(fields.phone.trim())) errors.phone = "Enter a valid phone number";
  const address = fields.address.trim();
  if (needsAddress && (address.length < 5 || address.length > 300)) {
    errors.address = "Enter your address (5 to 300 characters)";
  }
  const problem = fields.problemDescription.trim();
  if (problem.length < 10 || problem.length > 1000) {
    errors.problemDescription = "Describe the problem in 10 to 1000 characters";
  }
  return errors;
}

function apiErrorMessage(status: number, message?: string) {
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "Only customer accounts can book services.";
  return message || "Booking failed. Please try again.";
}

export default function BookingForm({ serviceId, mode }: { serviceId: string; mode: ServiceMode }) {
  const { data: session, isPending } = useSession();
  const needsAddress = mode !== "In-shop";

  const [fields, setFields] = useState<Fields>(emptyFields);
  const [errors, setErrors] = useState<Errors>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState<{ date: string; time: string } | null>(null);

  const update = (name: keyof Fields, value: string) => {
    setFields((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError("");

    const found = validate(fields, needsAddress);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    try {
      setLoading(true);

      // A fresh short-lived JWT for this request only (never stored)
      const { data, error } = await authClient.token();
      if (error || !data?.token) {
        setApiError(apiErrorMessage(401));
        return;
      }

      // Only these fields are sent. The server sets customer, price, title, technician and status.
      const response = await fetch(`${API_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.token}` },
        body: JSON.stringify({
          serviceId,
          preferredDate: fields.preferredDate,
          preferredTime: fields.preferredTime,
          phone: fields.phone.trim(),
          ...(needsAddress && { address: fields.address.trim() }),
          problemDescription: fields.problemDescription.trim(),
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setApiError(apiErrorMessage(response.status, result.message));
        return;
      }

      setBooked({ date: result.booking.preferredDate, time: result.booking.preferredTime });
    } catch {
      setApiError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (name: keyof Fields) =>
    errors[name] && <p className="mt-1 text-xs font-medium text-red-600">{errors[name]}</p>;

  let content: React.ReactNode;

  if (isPending) {
    content = <div className="h-40 animate-pulse rounded-lg bg-gray-100" aria-busy="true" />;
  } else if (!session) {
    content = (
      <div className="text-center">
        <p className="text-gray-700">Please sign in to book this service.</p>
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/sign-in" className="rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600">
            Sign in
          </Link>
          <Link href="/sign-up" className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-800 transition hover:bg-gray-50">
            Create an account
          </Link>
        </div>
      </div>
    );
  } else if (session.user.role !== "customer") {
    content = (
      <p className="rounded-lg bg-orange-50 p-4 text-sm font-medium text-orange-700">
        Only customer accounts can book services.
        {session.user.role && ` You are signed in as a ${session.user.role}.`}
      </p>
    );
  } else if (booked) {
    content = (
      <div className="rounded-lg bg-green-50 p-5 text-green-800">
        <p className="text-lg font-semibold">Booking request sent!</p>
        <p className="mt-1 text-sm">
          Requested for {booked.date}, {booked.time}. The technician will review your request, and you pay after the repair is completed.
        </p>
        <Link href="/services" className="mt-4 inline-block text-sm font-semibold text-green-800 underline">
          Back to services
        </Link>
      </div>
    );
  } else {
    content = (
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="preferredDate" className="mb-2 block text-sm font-semibold text-gray-800">Preferred date</label>
            <input
              id="preferredDate"
              type="date"
              min={today()}
              value={fields.preferredDate}
              onChange={(e) => update("preferredDate", e.target.value)}
              aria-invalid={Boolean(errors.preferredDate)}
              className={inputClass}
            />
            {fieldError("preferredDate")}
          </div>
          <div>
            <label htmlFor="preferredTime" className="mb-2 block text-sm font-semibold text-gray-800">Preferred time</label>
            <select
              id="preferredTime"
              value={fields.preferredTime}
              onChange={(e) => update("preferredTime", e.target.value)}
              aria-invalid={Boolean(errors.preferredTime)}
              className={inputClass}
            >
              <option value="">Select a time slot</option>
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
            {fieldError("preferredTime")}
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-gray-800">Phone</label>
          <input
            id="phone"
            type="tel"
            placeholder="+880 1700-000000"
            value={fields.phone}
            onChange={(e) => update("phone", e.target.value)}
            aria-invalid={Boolean(errors.phone)}
            className={inputClass}
          />
          {fieldError("phone")}
        </div>

        {needsAddress ? (
          <div>
            <label htmlFor="address" className="mb-2 block text-sm font-semibold text-gray-800">Address</label>
            <textarea
              id="address"
              rows={2}
              placeholder="House, road, area, city"
              value={fields.address}
              onChange={(e) => update("address", e.target.value)}
              aria-invalid={Boolean(errors.address)}
              className={inputClass}
            />
            {fieldError("address")}
          </div>
        ) : (
          <p className="text-sm text-gray-600">No address needed. You will drop the device at the technician&apos;s shop.</p>
        )}

        <div>
          <label htmlFor="problemDescription" className="mb-2 block text-sm font-semibold text-gray-800">Problem description</label>
          <textarea
            id="problemDescription"
            rows={4}
            placeholder="Tell the technician what is wrong with your device"
            value={fields.problemDescription}
            onChange={(e) => update("problemDescription", e.target.value)}
            aria-invalid={Boolean(errors.problemDescription)}
            className={inputClass}
          />
          {fieldError("problemDescription")}
        </div>

        {apiError && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">{apiError}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-orange-500 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Sending request..." : "Confirm Booking"}
        </button>
      </form>
    );
  }

  return (
    <section id="booking" className="mx-auto mt-12 max-w-2xl scroll-mt-20 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Book this service</h2>
      {content}
    </section>
  );
}
