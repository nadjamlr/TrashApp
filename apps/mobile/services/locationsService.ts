import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_LOCATIONS_SERVICE_URL;
const LOCATIONS_SERVICE_URL =
  BASE_URL ?? (Platform.OS === 'android' ? 'http://10.0.2.2:8005' : 'http://localhost:8005');

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
  return data.locations as Location[];
}

const HOEFE_CACHE_KEY = 'cached_wertstoffhoefe';

// Münchner Wertstoffhöfe: beim ersten Aufruf von der API laden und dauerhaft cachen.
export async function fetchAllWertstoffhoefe(): Promise<Location[]> {
  const cached = await AsyncStorage.getItem(HOEFE_CACHE_KEY);
  if (cached) return JSON.parse(cached) as Location[];

  // München-Mitte als Ankerpunkt, 20 km Radius deckt die ganze Stadt ab
  const params = new URLSearchParams({ lat: '48.1374', lng: '11.5755', radius: '20000' });
  const response = await fetch(`${LOCATIONS_SERVICE_URL}/locations?${params}`);
  if (!response.ok) throw new Error(`Locations service error: ${response.status}`);

  const data = await response.json();
  const hoefe = (data.locations as Location[]).filter(l => l.type === 'wertstoffhof');
  await AsyncStorage.setItem(HOEFE_CACHE_KEY, JSON.stringify(hoefe));
  return hoefe;
}
