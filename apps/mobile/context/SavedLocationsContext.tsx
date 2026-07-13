import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import type { Location } from '@/services/locationsService';

const STORAGE_KEY = 'saved_locations';

type SavedLocationsContextType = {
  savedLocations: Location[];
  isSaved: (id: string) => boolean;
  toggleSaved: (location: Location) => void;
};

const SavedLocationsContext = createContext<SavedLocationsContextType>({
  savedLocations: [],
  isSaved: () => false,
  toggleSaved: () => {},
});

export function SavedLocationsProvider({ children }: { children: ReactNode }) {
  const [savedLocations, setSavedLocations] = useState<Location[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setSavedLocations(JSON.parse(raw));
    });
  }, []);

  const isSaved = useCallback((id: string) => savedLocations.some(l => l.id === id), [savedLocations]);

  const toggleSaved = useCallback((location: Location) => {
    setSavedLocations(prev => {
      const next = prev.some(l => l.id === location.id)
        ? prev.filter(l => l.id !== location.id)
        : [...prev, location];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <SavedLocationsContext.Provider value={{ savedLocations, isSaved, toggleSaved }}>
      {children}
    </SavedLocationsContext.Provider>
  );
}

export function useSavedLocations() {
  return useContext(SavedLocationsContext);
}
