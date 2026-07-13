import * as Location from 'expo-location';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

const MUNICH_FALLBACK = { lat: 48.1374, lng: 11.5755 };

type LocationContextType = {
  lat: number;
  lng: number;
  address: string | null;
  loading: boolean;
  error: string | null;
};

export const LocationContext = createContext<LocationContextType>({
  ...MUNICH_FALLBACK,
  address: null,
  loading: true,
  error: null,
});

export function LocationProvider({ children }: { children: ReactNode }) { // State
  const [lat, setLat] = useState(MUNICH_FALLBACK.lat);
  const [lng, setLng] = useState(MUNICH_FALLBACK.lng);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Standortzugriff verweigert');
          setLoading(false);
          return;
        }

        const position = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = position.coords;
        setLat(latitude);
        setLng(longitude);

        const [result] = await Location.reverseGeocodeAsync({ latitude, longitude }); // nutzt Apple Maps oder Google Maps
        if (result) {
          const parts = [result.street, result.streetNumber, result.city].filter(Boolean);
          setAddress(parts.join(' '));
        }
      } catch (e) {
        setError('Standort nicht verfügbar');
      } finally {
        setLoading(false);
      }
    })();
  }, []); // läuft nur einmal beim Start der App ab

  return (
    <LocationContext.Provider value={{ lat, lng, address, loading, error }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() { // Hook
  return useContext(LocationContext);
}
