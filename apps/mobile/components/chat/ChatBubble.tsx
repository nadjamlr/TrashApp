import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View as DefaultView } from 'react-native';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { Radius } from '@/constants/Radius';
import { Shadows } from '@/constants/Shadows';
import { Sizes } from '@/constants/Sizes';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

import type { ChatMessage } from './types';

type Props = {
  message: ChatMessage;
};

export function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <DefaultView style={[styles.messageRow, isUser && styles.userMessageRow]}>
      {!isUser ? <BotAvatar /> : null}

      <DefaultView style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
          {message.content}
        </Text>

        {message.bullets ? (
          <DefaultView style={styles.bulletList}>
            {message.bullets.map((bullet) => (
              <DefaultView key={bullet} style={styles.bulletRow}>
                <DefaultView style={styles.bulletDot} />
                <Text style={styles.bulletText}>{bullet}</Text>
              </DefaultView>
            ))}
          </DefaultView>
        ) : null}

        {message.actions ? (
          <DefaultView style={styles.actions}>
            {message.actions.map((action, index) => (
              <Pressable
                key={action}
                style={[styles.actionButton, index === 0 ? styles.primaryAction : styles.secondaryAction]}
              >
                <Text style={[styles.actionText, index === 0 && styles.primaryActionText]}>{action}</Text>
              </Pressable>
            ))}
          </DefaultView>
        ) : null}
      </DefaultView>
    </DefaultView>
  );
}

export function BotAvatar() {
  return (
    <DefaultView style={styles.botAvatar}>
      <Ionicons
        name="chatbox-ellipses-outline"
        size={Sizes.icon.sm}
        color={Colors.light.background}
      />
    </DefaultView>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  bubble: {
    maxWidth: Layout.chatBubbleMaxWidth,
    minHeight: Sizes.chat.avatar,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    justifyContent: 'center',
  },
  assistantBubble: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: Spacing.sm,
  },
  messageText: {
    ...Typography.p1,
    includeFontPadding: false,
  },
  assistantText: {
    color: Colors.light.text,
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: Sizes.chat.avatar,
    height: Sizes.chat.avatar,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.text,
    shadowColor: Colors.light.text,
    ...Shadows.avatar,
  },
  userBubble: {
    backgroundColor: Colors.light.text,
    borderTopRightRadius: Spacing.sm,
  },
  userText: {
    color: Colors.light.background,
  },
  bulletList: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  bulletDot: {
    width: Sizes.chat.bulletDot,
    height: Sizes.chat.bulletDot,
    borderRadius: Radius.pill,
    marginTop: Sizes.chat.bulletDotTopOffset,
    backgroundColor: Colors.light.secondary,
  },
  bulletText: {
    flex: 1,
    ...Typography.p2,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  actionButton: {
    minHeight: Sizes.chat.actionMinHeight,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryAction: {
    backgroundColor: Colors.light.primary,
  },
  secondaryAction: {
    borderWidth: Sizes.border.hairline,
    borderColor: Colors.light.separator,
    backgroundColor: Colors.light.background,
  },
  actionText: {
    ...Typography.c1,
  },
  primaryActionText: {
    color: Colors.light.text,
  },
});

export const chatBubbleStyles = styles;
