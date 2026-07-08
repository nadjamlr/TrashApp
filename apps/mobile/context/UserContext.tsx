import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

type UserContextType = {
  hasCompletedOnboarding: boolean;
  selectedCity: string | null;
  isLoading: boolean;
  completeOnboarding: (city: string | null) => Promise<void>;
};

const UserContext = createContext<UserContextType>({
  hasCompletedOnboarding: false,
  selectedCity: null,
  isLoading: true,
  completeOnboarding: async () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const done = await AsyncStorage.getItem('onboarding_done');
      const city = await AsyncStorage.getItem('selected_city');
      setHasCompletedOnboarding(done === 'true');
      setSelectedCity(city);
      setIsLoading(false);
    })();
  }, []);

  async function completeOnboarding(city: string | null) {
    await AsyncStorage.setItem('onboarding_done', 'true');
    if (city) await AsyncStorage.setItem('selected_city', city);
    setHasCompletedOnboarding(true);
    setSelectedCity(city);
  }

  return (
    <UserContext.Provider value={{ hasCompletedOnboarding, selectedCity, isLoading, completeOnboarding }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
