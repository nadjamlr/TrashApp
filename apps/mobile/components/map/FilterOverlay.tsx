import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/themes/Themed';
import { useColorScheme } from '@/services/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';

type FilterOverlayProps = {
    visible: boolean;
    title: string;
    onClose: () => void;
    onApply: () => void;
    children: React.ReactNode;
};

export default function FilterOverlay({ visible, title, onClose, onApply, children }: FilterOverlayProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable style={styles.backdrop} onPress={onClose} />

            <View style={[styles.sheet, { backgroundColor: theme.background }]}>
                <View style={styles.handle} />

                <View style={styles.header}>
                    <Text variant="h3">{title}</Text>
                    <Pressable onPress={onClose} hitSlop={8}>
                        <Feather name="x" size={20} color={theme.text} />
                    </Pressable>
                </View>

                <View style={styles.content}>
                    {children}
                </View>

                <Pressable
                    style={[styles.applyButton, { backgroundColor: theme.text }]}
                    onPress={onApply}
                >
                    <Text variant="p1" style={{ color: theme.background }}>
                        Anwenden
                    </Text>
                </Pressable>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
        borderTopLeftRadius: Radius.lg,
        borderTopRightRadius: Radius.lg,
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.xl,
        gap: Spacing.md,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: Radius.pill,
        backgroundColor: 'rgba(0,0,0,0.15)',
        alignSelf: 'center',
        marginTop: Spacing.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    content: {
        gap: Spacing.sm,
    },
    applyButton: {
        borderRadius: Radius.pill,
        paddingVertical: Spacing.md,
        alignItems: 'center',
        marginTop: Spacing.sm,
    },
});
