import { Appearance } from 'react-native';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

type ColorScheme = 'light' | 'dark';

type ThemeContextType = {
    colorScheme: ColorScheme;
};

export const ThemeContext = createContext<ThemeContextType>({
    colorScheme: Appearance.getColorScheme() ?? 'light',
});

export function AppThemeProvider({ children }: { children: ReactNode }) {       // Wrapper im Layout für Theme, folgt den Handy-Systemeinstellungen
    const [colorScheme, setColorScheme] = useState<ColorScheme>(Appearance.getColorScheme() ?? 'light');

    useEffect(() => {
        const subscription = Appearance.addChangeListener(({ colorScheme: systemColorScheme }) => {
            setColorScheme(systemColorScheme ?? 'light');
        });
        return () => subscription.remove();
    }, []);

    return (
        <ThemeContext.Provider value={{ colorScheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useAppTheme() {
    return useContext(ThemeContext);
}
