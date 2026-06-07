import { useContext } from 'react';
import { ThemeContext } from '@/context/ThemeContext';

export function useColorScheme() {
    return useContext(ThemeContext).colorScheme;
}
