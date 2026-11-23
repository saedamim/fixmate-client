
export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled";

export const paymentStatusOptions: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  cancelled: "Cancelled",
};

export const paymentStatusStyle: Record<PaymentStatus, string> = {
  pending: "bg-orange-50 text-orange-600",
  paid: "bg-green-50 text-green-700",
  failed: "bg-red-50 text-red-600",
  cancelled: "bg-gray-100 text-gray-600",
};

export type Payment = {
  id: string;
  bookingId: string;
  serviceTitle: string;
  amount: number;
  currency: string; // "usd"
  provider: string; // "Stripe"
  status: PaymentStatus;
  transactionId: string | null; // the Stripe payment id, set once the payment is confirmed
  createdAt: string; // ISO date-time
  paidAt: string | null;
};


export type Transaction = Omit<Payment, "provider"> & {
  provider?: string;
  stripeSessionId?: string | null;
  customerName?: string;
  customerEmail?: string;
  technicianName?: string | null;
  technicianEmail?: string | null;
  failureReason?: string | null;
  reviewRequired?: boolean;
};

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });


export const shortId = (id: string) => id.slice(-6).toUpperCase();

// Sent by GET /api/payments/earnings: money Stripe confirmed for this technician (paid payments only)
export type Earnings = {
  totalEarnings: number;
  paidCount: number;
  currency: string;
  recent: { id: string; serviceTitle: string; customerName: string; amount: number; transactionId: string | null; paidAt: string | null }[];
};

// Sent in GET /api/services/mine: counts cover all of this technician's services
export type ServiceCounts = { total: number; pending: number; approved: number; rejected: number };
