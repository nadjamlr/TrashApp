import { createContext, ReactNode, useContext, useState } from 'react';

type ColorScheme = 'light' | 'dark';

type ThemeContextType = {
    colorScheme: ColorScheme;
    setColorScheme: (scheme: ColorScheme) => void;
};

export const ThemeContext = createContext<ThemeContextType>({
    colorScheme: 'light',
    setColorScheme: () => {},
});

export function AppThemeProvider({ children }: { children: ReactNode }) {
    const [colorScheme, setColorScheme] = useState<ColorScheme>('light');
    return (
        <ThemeContext.Provider value={{ colorScheme, setColorScheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useAppTheme() {
    return useContext(ThemeContext);
}
