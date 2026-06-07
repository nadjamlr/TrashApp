import { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing'

type ToggleProps = {
    size?: 'sm' | 'lg';
    isActive?: boolean;
    onToggle?: (value: boolean) => void;
};

const SIZE_CONFIG = {
    sm: { trackWidth: Spacing.xxl, trackHeight: Spacing.lg, thumb: Spacing.md, padding: Spacing.xs },
    lg: { trackWidth: 60, trackHeight: Spacing.xl, thumb: Spacing.lg, padding: Spacing.xs },
};

export function Toggle({ size = 'sm', isActive = false, onToggle }: ToggleProps) {
    const [active, setActive] = useState(isActive);
    const config = SIZE_CONFIG[size];
    const travel = config.trackWidth - config.thumb - config.padding * 2;

    const translateX = useRef(new Animated.Value(isActive ? travel : 0)).current;

    function handlePress() {
        const next = !active;
        setActive(next);
        onToggle?.(next);
        Animated.spring(translateX, {
            toValue: next ? travel : 0,
            useNativeDriver: true,
            bounciness: 4,
        }).start();
    }

    return (
        <Pressable
            onPress={handlePress}
            style={[
                styles.track,
                {
                    width: config.trackWidth,
                    height: config.trackHeight,
                    borderRadius: config.trackHeight / 2,
                    backgroundColor: active ? Colors.light.primary : Colors.light.muted,
                    padding: config.padding,
                },
            ]}
        >
            <Animated.View
                style={[
                    styles.thumb,
                    {
                        width: config.thumb,
                        height: config.thumb,
                        borderRadius: config.thumb / 2,
                        backgroundColor: active ? Colors.light.muted : Colors.light.primary,
                        transform: [{ translateX }],
                    },
                ]}
            />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    track: {
        justifyContent: 'center',
    },
    thumb: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
});
