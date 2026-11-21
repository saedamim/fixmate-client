// ---------------------------------------------------------------------------
// Services (Home, Services list, Details pages) are loaded from the backend API.
// `getRecentActivity` still returns SAMPLE DATA – replace its body with an API call
// when the backend has an endpoint for it.
// ---------------------------------------------------------------------------

export type ServiceMode = "On-site" | "In-shop" | "Pickup & Drop";

export type Service = {
  id: string;
  title: string;
  description: string;
  category: string;
  mode: ServiceMode;
  price: number;
  technician: string;
  imageUrl: string | null; // ImgBB URL from the backend; null shows a placeholder
  status: "pending" | "approved" | "rejected";
  available: boolean;
  featured: boolean;
  createdAt: string; // ISO date
};

export const categories = [
  { name: "Smartphone", icon: "📱" },
  { name: "Laptop & PC", icon: "💻" },
  { name: "AC", icon: "❄️" },
  { name: "Refrigerator", icon: "🧊" },
  { name: "TV", icon: "📺" },
  { name: "Washing Machine", icon: "🧺" },
  { name: "Electrical", icon: "⚡" },
];

export const categoryIcon = (name: string) =>
  categories.find((c) => c.name === name)?.icon ?? "🔧";

// Backend base URL (same server as auth). The /api/services endpoint returns
// approved services as { services, total, page, limit, totalPages }.
export const API_URL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:8000";

export type ServiceFilters = {
  search?: string;
  category?: string;
  mode?: string;
  sort?: string; // API values: "newest" | "price-low-to-high" | "price-high-to-low"
  page?: number;
  limit?: number; // API default 9, max 50
};

export type ServicesResult = {
  services: Service[];
  total: number;
  page: number;
  totalPages: number;
};

/**
 * Approved services from the backend API (GET /api/services).
 * Search, category, mode, sort and pagination are handled by the API.
 * Throws if the API cannot be reached or responds with an error.
 */
export async function getServices(filters: ServiceFilters = {}): Promise<ServicesResult> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) query.set(key, String(value)); // skip empty filters
  }

  const response = await fetch(`${API_URL}/api/services?${query}`);
  if (!response.ok) throw new Error(`Services API responded with ${response.status}`);

  return response.json();
}

/**
 * One approved service by id (GET /api/services/:id).
 * Returns null when the API says 404 (unknown id or not approved).
 * Throws on any other failure so the error page is shown.
 */
export async function getServiceById(id: string): Promise<Service | null> {
  const response = await fetch(`${API_URL}/api/services/${encodeURIComponent(id)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Services API responded with ${response.status}`);

  return response.json();
}

/**
 * 6 latest available, featured services for the Home page.
 * The API has no `featured` filter, so it returns approved services (newest
 * first, max 50 per request) and the featured ones are picked here.
 */
export async function getFeaturedServices(): Promise<Service[]> {
  const { services } = await getServices({ limit: 50 });

  return services.filter((s) => s.available && s.featured).slice(0, 6);
}

export type BookingActivity = {
  id: string;
  service: string;
  customer: string;
  location: string;
  status: "Booked" | "Technician on the way" | "Completed";
  price: number;
  warranty: string;
};

// SAMPLE ACTIVITY – fictional names, NOT real bookings. Replace with an API call
// (e.g. recent bookings from the backend) when it is ready.
export async function getRecentActivity(): Promise<BookingActivity[]> {
  return [
    { id: "a1", service: "AC Repair & Gas Refill", customer: "Sample Customer A", location: "Dhanmondi, Dhaka", status: "Completed", price: 45, warranty: "30-day warranty" },
    { id: "a2", service: "Laptop Fan Repair", customer: "Sample Customer B", location: "Chattogram", status: "Technician on the way", price: 30, warranty: "15-day warranty" },
    { id: "a3", service: "Refrigerator Not Cooling Fix", customer: "Sample Customer C", location: "Sylhet", status: "Booked", price: 40, warranty: "30-day warranty" },
    { id: "a4", service: "Screen Replacement", customer: "Sample Customer D", location: "Rajshahi", status: "Completed", price: 25, warranty: "60-day warranty" },
  ];
}

export const serviceModes: ServiceMode[] = ["On-site", "In-shop", "Pickup & Drop"];

// Static marketing content (not API data)
export const steps = [
  { title: "Find a Service", text: "Search or browse categories to find the repair you need." },
  { title: "Send a Request", text: "Pick a time slot and describe the problem in a short form." },
  { title: "Technician Fixes It", text: "A verified technician visits or collects the device and repairs it." },
  { title: "Pay After Completion", text: "Pay only once the repair is done and you are satisfied." },
];

export const features = [
  { title: "Verified technicians", text: "Every professional is background-checked and skill-tested.", icon: "🛡️" },
  { title: "Upfront pricing", text: "See the starting price before you book. No hidden charges.", icon: "💰" },
  { title: "30-day warranty", text: "Repairs are covered, so you can book with confidence.", icon: "✅" },
  { title: "Same-day visits", text: "Most bookings are served within hours, not days.", icon: "⚡" },
];

export const testimonials = [
  { name: "Sarah Johnson", role: "Homeowner", text: "My AC stopped on the hottest day. The technician arrived within two hours and it was fixed in one visit.", rating: 5 },
  { name: "Daniel Kim", role: "Apartment tenant", text: "Booking took a minute and the price matched the quote exactly. Very professional.", rating: 5 },
  { name: "Priya Patel", role: "Small business owner", text: "They repaired our fridge and washer the same week. Reliable and friendly service.", rating: 4 },
];

export const stats = [
  { value: "12k+", label: "Repairs completed" },
  { value: "350+", label: "Verified technicians" },
  { value: "4.8/5", label: "Average rating" },
  { value: "2 hrs", label: "Average arrival time" },
];
