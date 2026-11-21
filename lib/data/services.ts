// ---------------------------------------------------------------------------
// `getFeaturedServices` (Home page) already uses the backend API.
// The other `get*` functions still read SAMPLE DATA below – replace their bodies
// with API calls the same way when those pages are connected.
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

const sampleServices: Service[] = [
  { id: "s1", title: "Screen & Battery Replacement", description: "Cracked screen or weak battery? We replace screens and batteries for most popular smartphone brands using quality parts, and test touch, display and charging before returning the phone.", category: "Smartphone", mode: "In-shop", price: 25, technician: "Rafiq Ahmed", imageUrl: null, status: "approved", available: true, featured: true, createdAt: "2026-11-18" },
  { id: "s2", title: "Laptop Overheating & Fan Repair", description: "Fixes laptops that run hot, shut down or have a noisy fan. Includes cleaning dust, replacing thermal paste and swapping a faulty fan, with a full temperature check afterwards.", category: "Laptop & PC", mode: "Pickup & Drop", price: 30, technician: "Nusrat Jahan", imageUrl: null, status: "approved", available: true, featured: true, createdAt: "2026-11-16" },
  { id: "s3", title: "AC Repair & Gas Refill", description: "Diagnosis and repair for air conditioners that are not cooling, leaking water or making noise. Includes gas leak checking, gas refill and a cooling performance test.", category: "AC", mode: "On-site", price: 45, technician: "Karim Hossain", imageUrl: null, status: "approved", available: true, featured: true, createdAt: "2026-11-15" },
  { id: "s4", title: "Refrigerator Not Cooling Fix", description: "Repair for refrigerators that are not cooling, freezing too much or running loudly. Covers thermostat, compressor relay, door seal and fan checks.", category: "Refrigerator", mode: "On-site", price: 40, technician: "Sadia Islam", imageUrl: null, status: "approved", available: true, featured: true, createdAt: "2026-11-12" },
  { id: "s5", title: "LED / Smart TV Panel Repair", description: "Repair for LED and smart TVs with display lines, dark screens, backlight faults or sound problems. The panel and power board are inspected before any repair starts.", category: "TV", mode: "In-shop", price: 55, technician: "Tanvir Alam", imageUrl: null, status: "approved", available: true, featured: true, createdAt: "2026-11-10" },
  { id: "s6", title: "Washing Machine Drain & Spin Repair", description: "Fixes washing machines that do not drain, spin or start. Covers drain pump, belt, door lock and inlet valve problems for front and top loaders.", category: "Washing Machine", mode: "On-site", price: 35, technician: "Mizanur Rahman", imageUrl: null, status: "approved", available: true, featured: true, createdAt: "2026-11-08" },
  { id: "s7", title: "House Wiring & Switchboard Repair", description: "Safe repair of switchboards, sockets, wiring faults and tripping breakers by an experienced electrician. All work is tested before the visit ends.", category: "Electrical", mode: "On-site", price: 20, technician: "Habib Khan", imageUrl: null, status: "approved", available: true, featured: true, createdAt: "2026-11-05" },
  // Excluded from the home page: not approved / unavailable / not featured
  { id: "s8", title: "Water Pump Repair", description: "Repair and servicing for household water pumps that fail to start, lose pressure or overheat.", category: "Electrical", mode: "On-site", price: 28, technician: "Habib Khan", imageUrl: null, status: "pending", available: true, featured: true, createdAt: "2026-11-19" },
  { id: "s9", title: "Console Repair", description: "Repair for game consoles with overheating, disc drive or power problems.", category: "Laptop & PC", mode: "In-shop", price: 35, technician: "Nusrat Jahan", imageUrl: null, status: "approved", available: false, featured: true, createdAt: "2026-11-17" },
];

/** One approved service by id, or null (the page then shows "not found"). */
export async function getServiceById(id: string): Promise<Service | null> {
  return sampleServices.find((s) => s.id === id && s.status === "approved") ?? null;
}

// Backend base URL (same server as auth). The /api/services endpoint returns
// approved services as { services, total, page, limit, totalPages }.
const API_URL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:8000";

/**
 * 6 latest approved, available, featured services from the backend API.
 * The API has no `featured` filter, so it returns approved services (newest
 * first, max 50 per request) and the featured ones are picked here.
 * Throws if the API cannot be reached.
 */
export async function getFeaturedServices(): Promise<Service[]> {
  const response = await fetch(`${API_URL}/api/services?limit=50`);
  if (!response.ok) throw new Error(`Services API responded with ${response.status}`);

  const { services }: { services: Service[] } = await response.json();

  return services
    .filter((s) => s.status === "approved" && s.available && s.featured)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);
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

export type ServiceFilters = {
  search?: string;
  category?: string;
  mode?: string;
  sort?: string; // "newest" | "price-asc" | "price-desc"
};

/** Approved, available services with optional search, filters and sorting. */
export async function getServices({ search, category, mode, sort }: ServiceFilters = {}): Promise<Service[]> {
  const term = search?.trim().toLowerCase();

  const result = sampleServices.filter(
    (s) =>
      s.status === "approved" &&
      s.available &&
      (!category || s.category === category) &&
      (!mode || s.mode === mode) &&
      (!term || `${s.title} ${s.category} ${s.technician}`.toLowerCase().includes(term)),
  );

  // `result` is a new array (from filter), so sorting never changes sampleServices.
  // Number()/Date convert values safely if the backend sends prices as strings.
  if (sort === "price-asc") return result.sort((a, b) => Number(a.price) - Number(b.price));
  if (sort === "price-desc") return result.sort((a, b) => Number(b.price) - Number(a.price));
  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
