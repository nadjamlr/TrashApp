import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Radius } from '@/constants/Radius';
import { Shadows } from '@/constants/Shadows';
import { Spacing } from '@/constants/Spacing';
import type { Location } from '@/services/locationsService';

type Props = {
    locations?: Location[];
    onSelectLocation?: (location: Location) => void;
};

export default function Searchbar({ locations = [], onSelectLocation }: Props) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];
    const inputRef = useRef<TextInput>(null);
    const [query, setQuery] = useState('');
    const [focused, setFocused] = useState(false);

    const TYPE_HINTS = ['Wertstoffhof', 'Wertstoffinsel'];

    type Suggestion =
        | { kind: 'hint'; label: string }
        | { kind: 'location'; location: Location };

    const suggestions: Suggestion[] = query.length > 1
        ? locations
            .filter(loc =>
                loc.name.toLowerCase().includes(query.toLowerCase()) ||
                loc.address.toLowerCase().includes(query.toLowerCase())
            )
            .map(loc => ({ kind: 'location' as const, location: loc }))
        : TYPE_HINTS
            .filter(t => t.toLowerCase().includes(query.toLowerCase()))
            .map(t => ({ kind: 'hint' as const, label: t }));

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
                    placeholder="Standorte suchen..."
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
                            key={item.kind === 'location' ? item.location.id : item.label}
                            onPress={() => {
                                if (item.kind === 'hint') {
                                    setQuery(item.label);
                                    inputRef.current?.focus();
                                } else {
                                    setQuery(item.location.name);
                                    inputRef.current?.blur();
                                    onSelectLocation?.(item.location);
                                }
                            }}
                            style={[
                                styles.suggestionItem,
                                index < suggestions.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.separator },
                            ]}
                        >
                            <Feather
                                name={item.kind === 'hint' ? 'search' : 'map-pin'}
                                size={14}
                                color={theme.muted}
                            />
                            <View style={styles.suggestionText}>
                                <Text variant="p2" style={{ color: theme.text }}>
                                    {item.kind === 'hint' ? item.label : item.location.name}
                                </Text>
                                {item.kind === 'location' && item.location.address
                                    ? <Text variant="c2" style={{ color: theme.muted }}>{item.location.address}</Text>
                                    : null}
                            </View>
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
    suggestionText: {
        flex: 1,
        gap: 2,
    },
});
