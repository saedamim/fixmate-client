// Booking status values used by the backend, with the labels and colours shown in the dashboards.
export type BookingStatus = "requested" | "accepted" | "in_progress" | "completed" | "cancelled" | "rejected";

// "requested" is shown to people as "Pending"
export const statusLabel: Record<BookingStatus, string> = {
  requested: "Pending",
  accepted: "Accepted",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

// One colour per status everywhere: Requested blue, Accepted indigo, In Progress amber, Completed green, Rejected red, Cancelled gray
export const statusStyle: Record<BookingStatus, string> = {
  requested: "bg-blue-50 text-blue-700",
  accepted: "bg-indigo-50 text-indigo-700",
  in_progress: "bg-amber-50 text-amber-700",
  completed: "bg-green-50 text-green-700",
  cancelled: "bg-gray-100 text-gray-600",
  rejected: "bg-red-50 text-red-600",
};

// The same colours as plain text, for the number on a stats card
export const statusTextStyle: Record<BookingStatus, string> = {
  requested: "text-blue-700",
  accepted: "text-indigo-700",
  in_progress: "text-amber-600",
  completed: "text-green-700",
  cancelled: "text-gray-600",
  rejected: "text-red-600",
};

export const formatDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
