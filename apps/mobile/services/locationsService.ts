import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_LOCATIONS_SERVICE_URL;
const LOCATIONS_SERVICE_URL =
  BASE_URL ?? (Platform.OS === 'android' ? 'http://10.0.2.2:8005' : 'http://localhost:8005');

// Round to ~1 km grid so nearby locations share a cache entry
function cacheKey(lat: number, lng: number): string {
  const rLat = Math.round(lat * 100) / 100;
  const rLng = Math.round(lng * 100) / 100;
  return `locations_v1_${rLat}_${rLng}`;
}

export type LocationType = 'wertstoffhof' | 'wertstoffinsel';

export type OpeningHours = {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
};

export type Location = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance_m: number;
  materials: string[];
  type: LocationType;
  opening_hours: OpeningHours | null;
};

type FetchLocationsParams = {
  lat: number;
  lng: number;
  radius?: number;
  material?: string;
};

export async function fetchLocations({
  lat,
  lng,
  radius = 2000,
  material,
}: FetchLocationsParams): Promise<Location[]> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radius: String(radius),
    ...(material ? { material } : {}),
  });

  const response = await fetch(`${LOCATIONS_SERVICE_URL}/locations?${params}`);
  if (!response.ok) throw new Error(`Locations service error: ${response.status}`);

  const data = await response.json();
  return (data.locations as Location[]).filter(l => l.lat != null && l.lng != null);
}

export async function fetchLocationsWithCache(
  params: FetchLocationsParams
): Promise<{ locations: Location[]; fromCache: boolean }> {
  const key = cacheKey(params.lat, params.lng);
  try {
    const locations = await fetchLocations(params);
    AsyncStorage.setItem(key, JSON.stringify(locations)).catch(() => {});
    return { locations, fromCache: false };
  } catch {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        const cached = JSON.parse(raw) as Location[];
        return { locations: cached, fromCache: true };
      }
    } catch {}
    return { locations: [], fromCache: false };
  }
}