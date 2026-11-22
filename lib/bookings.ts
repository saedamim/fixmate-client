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

export const statusStyle: Record<BookingStatus, string> = {
  requested: "bg-orange-50 text-orange-600",
  accepted: "bg-teal-50 text-teal-700",
  in_progress: "bg-sky-50 text-sky-700",
  completed: "bg-green-50 text-green-700",
  cancelled: "bg-gray-100 text-gray-600",
  rejected: "bg-red-50 text-red-600",
};

export const formatDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
