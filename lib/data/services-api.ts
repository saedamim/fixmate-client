"use cache";

import { cacheLife } from "next/cache";
import { API_URL, type Service, type ServiceFilters, type ServicesResult } from "@/lib/data/services";

// Public service data is cached for a minute on the server, so repeat visits do not wait for the API each time.
// A new or newly approved service therefore shows up within about a minute. (Server components only.)

export async function getServices(filters: ServiceFilters = {}): Promise<ServicesResult> {
  cacheLife("minutes");
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) query.set(key, String(value)); // skip empty filters
  }

  const response = await fetch(`${API_URL}/api/services?${query}`);
  if (!response.ok) throw new Error(`Services API responded with ${response.status}`);

  return response.json();
}


export async function getServiceById(id: string): Promise<Service | null> {
  cacheLife("minutes");
  const response = await fetch(`${API_URL}/api/services/${encodeURIComponent(id)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Services API responded with ${response.status}`);

  return response.json();
}


// The 6 newest approved services, for the Home page (the API already returns only approved ones)
export async function getLatestServices(): Promise<Service[]> {
  cacheLife("minutes");
  const { services } = await getServices({ sort: "newest", limit: 6 });

  return services.filter((s) => s.available);
}

