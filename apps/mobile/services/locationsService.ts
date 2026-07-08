const BASE_URL = process.env.EXPO_PUBLIC_LOCATIONS_SERVICE_URL;

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
  if (!BASE_URL) throw new Error('EXPO_PUBLIC_LOCATIONS_SERVICE_URL is not set');

  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radius: String(radius),
    ...(material ? { material } : {}),
  });

  const response = await fetch(`${BASE_URL}/locations?${params}`);
  if (!response.ok) throw new Error(`Locations service error: ${response.status}`);

  const data = await response.json();
  return data.locations as Location[];
}
