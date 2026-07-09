import { ActivityIndicator, StyleSheet, View as DefaultView } from 'react-native';

import { Text } from '@/components/themes/Themed';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

import { BotAvatar, ChatBubble, chatBubbleStyles } from './ChatBubble';
import type { ChatMessage } from './types';

type Props = {
  messages: ChatMessage[];
  isLoading: boolean;
};

export function ChatMessageList({ messages, isLoading }: Props) {
  return (
    <DefaultView style={styles.messageList}>
      {messages.map((message) => (
        <ChatBubble key={message.id} message={message} />
      ))}

      {isLoading ? (
        <DefaultView style={chatBubbleStyles.messageRow}>
          <BotAvatar />
          <DefaultView style={[chatBubbleStyles.bubble, chatBubbleStyles.assistantBubble, styles.loadingBubble]}>
            <ActivityIndicator size="small" color={Colors.light.text} />
            <Text style={[chatBubbleStyles.messageText, chatBubbleStyles.assistantText]}>Thinking...</Text>
          </DefaultView>
        </DefaultView>
      ) : null}
    </DefaultView>
  );
}

const styles = StyleSheet.create({
  messageList: {
    gap: Spacing.lg,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
