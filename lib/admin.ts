import { statusLabel, type BookingStatus } from "@/lib/bookings";
import type { Service } from "@/lib/data/services";
import type { Option } from "@/components/dashboard/PagedList";

export type AdminUser = { id: string; name: string; email: string; role: string; emailVerified: boolean; createdAt: string };

export type AdminBooking = {
  id: string;
  serviceTitle: string;
  customerName: string;
  technician: string;
  preferredDate: string;
  preferredTime: string;
  price: number;
  finalAmount?: number;
  paymentStatus: string;
  status: BookingStatus;
};

export const roleOptions: Option[] = [
  { value: "all", label: "All" },
  { value: "customer", label: "Customers" },
  { value: "technician", label: "Technicians" },
  { value: "admin", label: "Admins" },
];

export const serviceOptions: Option[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

export const bookingOptions: Option[] = [
  { value: "all", label: "All" },
  ...(Object.keys(statusLabel) as BookingStatus[]).map((s) => ({ value: s, label: statusLabel[s] })),
];

export const serviceStatusStyle: Record<Service["status"], string> = {
  pending: "bg-orange-50 text-orange-600",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-600",
};
