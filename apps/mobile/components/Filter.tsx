import { Pressable, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Radius } from '@/constants/Radius';
import FilterOverlay from '@/components/FilterOverlay';

type FilterProps = {
    label: string;
    isActive?: boolean;
    onPress?: () => void;
    overlayTitle?: string;
    onApply?: () => void;
    children?: React.ReactNode;
};

export default function Filter({ label, isActive = false, onPress, overlayTitle, onApply, children }: FilterProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];
    const [active, setActive] = useState(isActive);
    const [overlayVisible, setOverlayVisible] = useState(false);

    useEffect(() => { setActive(isActive); }, [isActive]);

    function handlePress() {
        if (children) {
            setOverlayVisible(true);
        } else {
            setActive(prev => !prev);
            onPress?.();
        }
    }

    function handleApply() {
        setActive(true);
        setOverlayVisible(false);
        onApply?.();
    }

    function handleClose() {
        setOverlayVisible(false);
    }

    return (
        <>
            <Pressable
                onPress={handlePress}
                style={[
                    styles.chip,
                    { backgroundColor: active ? theme.primary : theme.surface },
                ]}
            >
                <Text variant="c1" style={{ color: theme.text }}>
                    {label}
                </Text>
            </Pressable>

            {children && (
                <FilterOverlay
                    visible={overlayVisible}
                    title={overlayTitle ?? label}
                    onClose={handleClose}
                    onApply={handleApply}
                >
                    {children}
                </FilterOverlay>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    chip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        borderRadius: Radius.sm,
        alignSelf: 'flex-start',
    },
});
