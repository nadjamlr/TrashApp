import Ionicons from '@expo/vector-icons/Ionicons';
import { Platform, Pressable, StyleSheet, TextInput, View as DefaultView } from 'react-native';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { Radius } from '@/constants/Radius';
import { Shadows } from '@/constants/Shadows';
import { Sizes } from '@/constants/Sizes';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

type Props = {
  draft: string;
  errorMessage: string | null;
  isLoading: boolean;
  bottom: number;
  onChangeDraft: (value: string) => void;
  onSend: () => void;
};

export function ChatComposer({
  draft,
  errorMessage,
  isLoading,
  bottom,
  onChangeDraft,
  onSend,
}: Props) {
  return (
    <DefaultView style={[styles.composerDock, { bottom }]}>
      {errorMessage ? (
        <DefaultView style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </DefaultView>
      ) : null}

      <DefaultView style={styles.composerWrap}>
        <DefaultView style={styles.composer}>
          <DefaultView style={styles.inputSlot}>
            {!draft ? (
              <Text pointerEvents="none" style={styles.inputPlaceholder}>
                Nachricht schreiben...
              </Text>
            ) : null}
            <TextInput
              value={draft}
              onChangeText={onChangeDraft}
              placeholder=""
              multiline={false}
              returnKeyType="send"
              onSubmitEditing={onSend}
              editable={!isLoading}
              style={styles.input}
            />
          </DefaultView>
          <Pressable style={styles.cameraButton}>
            <Icon name="camera" size={Sizes.icon.md} color={Colors.light.muted} />
          </Pressable>
        </DefaultView>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send message"
          disabled={!draft.trim() || isLoading}
          onPress={onSend}
          style={[styles.sendButton, (!draft.trim() || isLoading) && styles.sendButtonDisabled]}
        >
          <Ionicons name="send" size={Sizes.icon.md} color={Colors.light.text} />
        </Pressable>
      </DefaultView>
    </DefaultView>
  );
}

const styles = StyleSheet.create({
  composerDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Layout.chatComposerBottomOffset,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  composerWrap: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  composer: {
    flex: 1,
    minHeight: Sizes.chat.composerHeight,
    borderRadius: Radius.pill,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    shadowColor: Colors.light.text,
    ...Shadows.composer,
  },
  inputSlot: {
    flex: 1,
    height: Sizes.chat.composerHeight,
  },
  inputPlaceholder: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: (Sizes.chat.composerHeight - Typography.p1.lineHeight) / 2,
    height: Typography.p1.lineHeight,
    color: Colors.light.muted,
    ...Typography.p1,
    lineHeight: Typography.p1.lineHeight,
    includeFontPadding: false,
  },
  input: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: Sizes.chat.composerHeight,
    paddingTop: 0,
    paddingBottom: 0,
    margin: 0,
    color: Colors.light.text,
    textAlignVertical: Platform.OS === 'android' ? 'center' : undefined,
    fontSize: Typography.p1.fontSize,
    fontWeight: Typography.p1.fontWeight,
    includeFontPadding: false,
  },
  cameraButton: {
    width: Sizes.chat.avatar,
    height: Sizes.chat.avatar,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: Sizes.chat.sendButton,
    height: Sizes.chat.sendButton,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    shadowColor: Colors.light.text,
    ...Shadows.action,
  },
  sendButtonDisabled: {
    opacity: Layout.disabledOpacity,
  },
  errorContainer: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.light.surface,
  },
  errorText: {
    color: '#B42318',
    ...Typography.c1,
  },
});
