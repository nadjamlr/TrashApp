import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View as DefaultView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { Radius } from '@/constants/Radius';
import { Shadows } from '@/constants/Shadows';
import { Sizes } from '@/constants/Sizes';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  bullets?: string[];
  actions?: string[];
};

const initialMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content:
      "Hello! I'm your waste management assistant. Ask me anything about waste sorting, recycling, or our services.",
  },
];

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState('');
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = () => {
    const trimmedDraft = draft.trim();
    if (!trimmedDraft) return;

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `${Date.now()}`,
        role: 'user',
        content: trimmedDraft,
      },
    ]);
    setDraft('');
    requestAnimationFrame(() => scrollViewRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? Layout.keyboardVerticalOffset : 0}
        style={styles.keyboardView}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.lg }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text variant="display" style={styles.title}>
            Chatbot
          </Text>

          <DefaultView style={styles.messageList}>
            {messages.map((message) => (
              <DefaultView
                key={message.id}
                style={[styles.messageRow, message.role === 'user' && styles.userMessageRow]}
              >
                {message.role === 'assistant' ? (
                  <DefaultView style={styles.botAvatar}>
                    <Ionicons
                      name="chatbox-ellipses-outline"
                      size={Sizes.icon.sm}
                      color={Colors.light.background}
                    />
                  </DefaultView>
                ) : null}

                <DefaultView
                  style={[styles.bubble, message.role === 'user' ? styles.userBubble : styles.assistantBubble]}
                >
                  <Text
                    style={[styles.messageText, message.role === 'user' ? styles.userText : styles.assistantText]}
                  >
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
            ))}
          </DefaultView>
        </ScrollView>

        <DefaultView style={styles.composerDock}>
          <DefaultView style={styles.composerWrap}>
            <DefaultView style={styles.composer}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Type your message..."
                placeholderTextColor={Colors.light.muted}
                returnKeyType="send"
                onSubmitEditing={sendMessage}
                style={styles.input}
              />
              <Pressable style={styles.cameraButton}>
                <Icon name="camera" size={Sizes.icon.md} color={Colors.light.muted} />
              </Pressable>
            </DefaultView>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send message"
              disabled={!draft.trim()}
              onPress={sendMessage}
              style={[styles.sendButton, !draft.trim() && styles.sendButtonDisabled]}
            >
              <Ionicons name="send" size={Sizes.icon.md} color={Colors.light.text} />
            </Pressable>
          </DefaultView>
        </DefaultView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Layout.chatScrollBottomPadding,
  },
  title: {
    marginBottom: Spacing.lg,
  },
  messageList: {
    gap: Spacing.lg,
  },
  messageRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
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
  bubble: {
    maxWidth: Layout.chatBubbleMaxWidth,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  assistantBubble: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: Spacing.sm,
  },
  userBubble: {
    backgroundColor: Colors.light.text,
    borderTopRightRadius: Spacing.sm,
  },
  messageText: {
    ...Typography.bodyStrong,
  },
  assistantText: {
    color: Colors.light.text,
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
    ...Typography.body,
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
    ...Typography.captionStrong,
  },
  primaryActionText: {
    color: Colors.light.text,
  },
  composerDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Layout.chatComposerBottomOffset,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
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
  input: {
    flex: 1,
    minHeight: Sizes.chat.composerHeight,
    color: Colors.light.text,
    ...Typography.bodyStrong,
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
});
