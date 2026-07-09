import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { NativeModules, Platform } from 'react-native';

export type Language = 'de' | 'en';

const STORAGE_KEY = 'app_language';

const translations = {
  de: {
    profile: 'Profil',
    personalDetails: 'Persönliche Daten',
    personalInfo: 'Persönliche Informationen',
    personalInfoDetails: 'Name, Adresse, E-Mail, Telefon, Nutzername',
    savedLocations: 'Gespeicherte Standorte',
    noSavedLocations: 'Keine gespeicherten Standorte',
    showMore: (n: number) => `${n} weitere anzeigen`,
    showLess: 'Weniger anzeigen',
    collection: 'Sammlung',
    products: 'Produkte',
    security: 'Sicherheit',
    access: 'Zugriff',
    accessDetails: 'Karten, Fotos',
    safety: 'Sicherheit',
    safetyDetails: 'Passwort, PIN',
    generalSettings: 'Allgemeine Einstellungen',
    notifications: 'Benachrichtigungen',
    notificationsDetails: 'Push-Benachrichtigungen',
    language: 'Sprache',
    languageDetails: 'App-Sprache auswählen',
    darkMode: 'Dunkelmodus',
    darkModeDetails: 'Hell- oder Dunkeldesign wählen',
  },
  en: {
    profile: 'Profile',
    personalDetails: 'Personal Details',
    personalInfo: 'Personal Info',
    personalInfoDetails: 'Name, address, email, phone, username',
    savedLocations: 'Saved Locations',
    noSavedLocations: 'No saved locations',
    showMore: (n: number) => `Show ${n} more`,
    showLess: 'Show less',
    collection: 'Collection',
    products: 'Products',
    security: 'Security',
    access: 'Access',
    accessDetails: 'Maps, photos',
    safety: 'Safety',
    safetyDetails: 'Password, PIN',
    generalSettings: 'General Settings',
    notifications: 'Notifications',
    notificationsDetails: 'Push notifications',
    language: 'Language',
    languageDetails: 'Choose the language for the app',
    darkMode: 'Dark Mode',
    darkModeDetails: 'Choose dark or light mode',
  },
} as const;

export type Translations = {
  profile: string;
  personalDetails: string;
  personalInfo: string;
  personalInfoDetails: string;
  savedLocations: string;
  noSavedLocations: string;
  showMore: (n: number) => string;
  showLess: string;
  collection: string;
  products: string;
  security: string;
  access: string;
  accessDetails: string;
  safety: string;
  safetyDetails: string;
  generalSettings: string;
  notifications: string;
  notificationsDetails: string;
  language: string;
  languageDetails: string;
  darkMode: string;
  darkModeDetails: string;
};

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'de',
  setLanguage: () => {},
  t: translations.de,
});

function getDeviceLanguage(): Language {
  const locale: string =
    Platform.OS === 'ios'
      ? NativeModules.SettingsManager?.settings?.AppleLocale ||
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
        'de'
      : NativeModules.I18nManager?.localeIdentifier || 'de';
  return locale.startsWith('de') ? 'de' : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getDeviceLanguage());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'de' || stored === 'en') {
        setLanguageState(stored);
      }
    });
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(STORAGE_KEY, lang);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
