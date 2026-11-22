// Payment record fields and labels shared by the customer Payment History and the admin Transactions page.
// A payment is "paid" only when the backend has validated it with SSLCommerz; the client never decides that.
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

// Shape of a payment from GET /api/payments/my
export type Payment = {
  id: string;
  bookingId: string;
  tranId: string;
  serviceTitle: string;
  amount: number;
  currency: string;
  provider: string;
  status: PaymentStatus;
  createdAt: string; // ISO date-time
  paidAt: string | null;
};

// A transaction from GET /api/admin/transactions: the same record plus who paid and a few review fields
export type Transaction = Payment & {
  customerName?: string;
  customerEmail?: string;
  technicianEmail?: string | null;
  failureReason?: string | null;
  reviewRequired?: boolean;
};

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

// A short reference for a booking id, so the full database id is not shown
export const shortId = (id: string) => id.slice(-6).toUpperCase();
