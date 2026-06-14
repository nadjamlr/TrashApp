import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Radius } from '@/constants/Radius';
import { Shadows } from '@/constants/Shadows';
import { Spacing } from '@/constants/Spacing';

const MOCK_SUGGESTIONS = [
    'Wertstoffinsel',
    'Glascontainer',
    'Papiercontainer',
    'Pfandautomat',
    'Plastikcontainer'
    
];

export default function Searchbar() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];
    const inputRef = useRef<TextInput>(null);
    const [query, setQuery] = useState('');
    const [focused, setFocused] = useState(false);

    const suggestions = query.length > 0
        ? MOCK_SUGGESTIONS.filter(s => s.toLowerCase().includes(query.toLowerCase()))
        : MOCK_SUGGESTIONS;

    const showSuggestions = focused && suggestions.length > 0;

    return (
        <View>
            <Pressable
                onPress={() => inputRef.current?.focus()}
                style={[styles.container, { backgroundColor: theme.surface, borderColor: focused ? theme.secondary : 'transparent' }]}
            >
                <Feather name="search" size={18} color={theme.muted} />
                <TextInput
                    ref={inputRef}
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Search for locations.."
                    placeholderTextColor={theme.muted}
                    value={query}
                    onChangeText={setQuery}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => setFocused(false), 150)}
                />
                {query.length > 0 && (
                    <Pressable onPress={() => setQuery('')} hitSlop={8}>
                        <Feather name="x" size={16} color={theme.muted} />
                    </Pressable>
                )}
            </Pressable>

            {showSuggestions && (
                <View style={[styles.suggestionList, { backgroundColor: theme.background, shadowColor: theme.text }]}>
                    {suggestions.map((item, index) => (
                        <Pressable
                            key={item}
                            onPress={() => {
                                setQuery(item);
                                inputRef.current?.blur();
                            }}
                            style={[
                                styles.suggestionItem,
                                index < suggestions.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.separator },
                            ]}
                        >
                            <Feather name="map-pin" size={14} color={theme.muted} />
                            <Text variant="p2" style={{ color: theme.text }}>{item}</Text>
                        </Pressable>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        borderRadius: Radius.sm,
        borderWidth: 1.5,
        ...Shadows.composer,
    },
    input: {
        flex: 1,
        fontSize: 18,
        paddingVertical: Spacing.sm,
    },
    suggestionList: {
        marginTop: Spacing.xs,
        borderRadius: Radius.md,
        overflow: 'hidden',
        ...Shadows.action,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm + 2,
    },
});
