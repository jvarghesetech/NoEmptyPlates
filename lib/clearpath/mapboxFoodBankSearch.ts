import { Hospital } from './types';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface SuggestResult {
  name: string;
  mapbox_id: string;
  full_address?: string;
  distance?: number;
}

interface RetrieveFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name: string;
    mapbox_id: string;
    full_address?: string;
    context?: { place?: { name?: string } };
    metadata?: { phone?: string };
  };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

// Deterministic hash so the same food bank shows stable simulated wait/capacity across requests
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Finds real nearby food banks via Mapbox's text search (no dedicated
 * "food_bank" POI category exists, so this uses suggest+retrieve with a
 * "food bank" query). No live source exists for wait times or how many
 * households a bank can serve, so those are simulated (deterministically,
 * per location) — name, address, phone, and coordinates are real.
 */
export async function searchNearbyFoodBanks(
  lat: number,
  lng: number,
  opts: { limit?: number; radiusKm?: number } = {}
): Promise<Hospital[]> {
  const limit = opts.limit ?? 8;
  const radiusKm = opts.radiusKm ?? 80;

  if (!MAPBOX_TOKEN) {
    throw new Error('NEXT_PUBLIC_MAPBOX_TOKEN is not configured');
  }

  const sessionToken = `fb-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const suggestUrl =
    `https://api.mapbox.com/search/searchbox/v1/suggest?q=food%20bank` +
    `&proximity=${lng},${lat}&access_token=${MAPBOX_TOKEN}&limit=10&session_token=${sessionToken}`;

  const suggestRes = await fetch(suggestUrl);
  if (!suggestRes.ok) {
    throw new Error(`Mapbox suggest failed: ${suggestRes.status}`);
  }
  const suggestData = (await suggestRes.json()) as { suggestions: SuggestResult[] };

  // Retrieve full details (coordinates, phone) for each suggestion in parallel
  const retrieved = await Promise.all(
    suggestData.suggestions.map(async (s) => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/search/searchbox/v1/retrieve/${s.mapbox_id}` +
            `?access_token=${MAPBOX_TOKEN}&session_token=${sessionToken}`
        );
        if (!res.ok) return null;
        const data = (await res.json()) as { features: RetrieveFeature[] };
        return data.features[0] ?? null;
      } catch {
        return null;
      }
    })
  );

  const seenCoords = new Set<string>();
  const candidates: Hospital[] = [];

  for (const f of retrieved) {
    if (!f) continue;

    const [poiLng, poiLat] = f.geometry.coordinates;
    const distanceKm = haversineKm(lat, lng, poiLat, poiLng);
    if (distanceKm > radiusKm) continue;

    const coordKey = `${poiLat.toFixed(3)},${poiLng.toFixed(3)}`;
    if (seenCoords.has(coordKey)) continue;
    seenCoords.add(coordKey);

    const id = f.properties.mapbox_id;
    const h = hashString(id);

    candidates.push({
      id,
      name: f.properties.name,
      city: f.properties.context?.place?.name?.toLowerCase() ?? '',
      latitude: poiLat,
      longitude: poiLng,
      // Repurposed for food banks: totalBeds -> households served/week,
      // erBeds -> daily distribution capacity (drives the coverage simulation)
      totalBeds: 40 + (h % 360),
      erBeds: 10 + (h % 50),
      phone: f.properties.metadata?.phone,
    });
  }

  candidates.sort(
    (a, b) =>
      haversineKm(lat, lng, a.latitude, a.longitude) - haversineKm(lat, lng, b.latitude, b.longitude)
  );

  return candidates.slice(0, limit);
}

/** Stable simulated wait so the same food bank doesn't jump around between requests. */
export function simulateFoodBankWait(id: string): { occupancyPct: number; waitMinutes: number } {
  const h = hashString(id + 'wait');
  return {
    occupancyPct: 30 + (h % 61), // 30-90
    waitMinutes: 5 + (h % 41), // 5-45
  };
}
