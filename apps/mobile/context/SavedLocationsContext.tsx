import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import type { Location } from '@/services/locationsService';

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

  const isSaved = useCallback((id: string) => savedLocations.some(l => l.id === id), [savedLocations]);

  const toggleSaved = useCallback((location: Location) => {
    setSavedLocations(prev =>
      prev.some(l => l.id === location.id)
        ? prev.filter(l => l.id !== location.id)
        : [...prev, location]
    );
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
