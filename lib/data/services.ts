

export type ServiceMode = "On-site" | "In-shop" | "Pickup & Drop";

export type Service = {
  id: string;
  title: string;
  description: string;
  category: string;
  mode: ServiceMode;
  price: number;
  duration?: string; // estimated duration, e.g. "1-2 hours" (older services have none)
  serviceArea?: string;
  technician: string;
  // Shown in the technician summary on the details page when the API sends them
  technicianImage?: string | null;
  technicianArea?: string;
  technicianBio?: string;
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



export const API_URL = (process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:8000").replace(/\/+$/, "");

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


export async function getServices(filters: ServiceFilters = {}): Promise<ServicesResult> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) query.set(key, String(value)); // skip empty filters
  }

  const response = await fetch(`${API_URL}/api/services?${query}`);
  if (!response.ok) throw new Error(`Services API responded with ${response.status}`);

  return response.json();
}


export async function getServiceById(id: string): Promise<Service | null> {
  const response = await fetch(`${API_URL}/api/services/${encodeURIComponent(id)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Services API responded with ${response.status}`);

  return response.json();
}


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
