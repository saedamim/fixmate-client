// ---------------------------------------------------------------------------
// SAMPLE DATA – replace with real API calls when the backend is ready.
// Only the `get*` functions below are used by pages, so connecting the backend
// means changing their bodies (e.g. `fetch(`${API_URL}/api/services?...`)`).
// ---------------------------------------------------------------------------

export type ServiceMode = "On-site" | "In-shop" | "Pickup & Drop";

export type Service = {
  id: string;
  title: string;
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

const sampleServices: Service[] = [
  { id: "s1", title: "Screen & Battery Replacement", category: "Smartphone", mode: "In-shop", price: 25, technician: "Rafiq Ahmed", imageUrl: null, status: "approved", available: true, featured: true, createdAt: "2026-11-18" },
  { id: "s2", title: "Laptop Overheating & Fan Repair", category: "Laptop & PC", mode: "Pickup & Drop", price: 30, technician: "Nusrat Jahan", imageUrl: null, status: "approved", available: true, featured: true, createdAt: "2026-11-16" },
  { id: "s3", title: "AC Repair & Gas Refill", category: "AC", mode: "On-site", price: 45, technician: "Karim Hossain", imageUrl: null, status: "approved", available: true, featured: true, createdAt: "2026-11-15" },
  { id: "s4", title: "Refrigerator Not Cooling Fix", category: "Refrigerator", mode: "On-site", price: 40, technician: "Sadia Islam", imageUrl: null, status: "approved", available: true, featured: true, createdAt: "2026-11-12" },
  { id: "s5", title: "LED / Smart TV Panel Repair", category: "TV", mode: "In-shop", price: 55, technician: "Tanvir Alam", imageUrl: null, status: "approved", available: true, featured: true, createdAt: "2026-11-10" },
  { id: "s6", title: "Washing Machine Drain & Spin Repair", category: "Washing Machine", mode: "On-site", price: 35, technician: "Mizanur Rahman", imageUrl: null, status: "approved", available: true, featured: true, createdAt: "2026-11-08" },
  { id: "s7", title: "House Wiring & Switchboard Repair", category: "Electrical", mode: "On-site", price: 20, technician: "Habib Khan", imageUrl: null, status: "approved", available: true, featured: true, createdAt: "2026-11-05" },
  // Excluded from the home page: not approved / unavailable / not featured
  { id: "s8", title: "Water Pump Repair", category: "Electrical", mode: "On-site", price: 28, technician: "Habib Khan", imageUrl: null, status: "pending", available: true, featured: true, createdAt: "2026-11-19" },
  { id: "s9", title: "Console Repair", category: "Laptop & PC", mode: "In-shop", price: 35, technician: "Nusrat Jahan", imageUrl: null, status: "approved", available: false, featured: true, createdAt: "2026-11-17" },
];

/** 6 latest approved, available, featured services (newest first). */
export async function getFeaturedServices(): Promise<Service[]> {
  return sampleServices
    .filter((s) => s.status === "approved" && s.available && s.featured)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);
}

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
