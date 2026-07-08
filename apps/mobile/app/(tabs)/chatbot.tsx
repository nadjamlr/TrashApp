import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
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

type ConversationMessage = Pick<ChatMessage, 'role' | 'content'>;

type ChatAskResponse = {
  response: string;
  suggested_location: { lat: number; lng: number } | null;
};

const CHAT_API_BASE_URL =
  process.env.EXPO_PUBLIC_CHAT_AGENT_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8004' : 'http://localhost:8004');

const initialMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content:
      'Hallo! Ich bin dein Abfall-Assistent. Frag mich alles zur Muelltrennung, zum Recycling oder zur richtigen Entsorgung.',
  },
];

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      requestAnimationFrame(() => scrollViewRef.current?.scrollToEnd({ animated: true }));
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const sendMessage = async () => {
    const trimmedDraft = draft.trim();
    if (!trimmedDraft || isLoading) return;

    const conversationHistory: ConversationMessage[] = messages
      .filter((message) => message.id !== 'welcome')
      .map(({ role, content }) => ({ role, content }));
    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: trimmedDraft,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setDraft('');
    setErrorMessage(null);
    setIsLoading(true);
    requestAnimationFrame(() => scrollViewRef.current?.scrollToEnd({ animated: true }));

    try {
      const response = await fetch(`${CHAT_API_BASE_URL}/chat/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmedDraft,
          conversation_history: conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat request failed with status ${response.status}`);
      }

      const data = (await response.json()) as ChatAskResponse;

      if (!data.response) {
        throw new Error('Chat response did not include a response message');
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: data.response,
        },
      ]);
      requestAnimationFrame(() => scrollViewRef.current?.scrollToEnd({ animated: true }));
    } catch {
      setErrorMessage('Could not reach the waste assistant. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
          <Text variant="h1" style={styles.title}>
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

            {isLoading ? (
              <DefaultView style={styles.messageRow}>
                <DefaultView style={styles.botAvatar}>
                  <Ionicons
                    name="chatbox-ellipses-outline"
                    size={Sizes.icon.sm}
                    color={Colors.light.background}
                  />
                </DefaultView>
                <DefaultView style={[styles.bubble, styles.assistantBubble, styles.loadingBubble]}>
                  <ActivityIndicator size="small" color={Colors.light.text} />
                  <Text style={[styles.messageText, styles.assistantText]}>Thinking...</Text>
                </DefaultView>
              </DefaultView>
            ) : null}
          </DefaultView>
        </ScrollView>

        <DefaultView
          style={[
            styles.composerDock,
            {
              bottom: keyboardHeight
                ? keyboardHeight + Spacing.md
                : Layout.chatComposerBottomOffset,
            },
          ]}
        >
          {errorMessage ? (
            <DefaultView style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </DefaultView>
          ) : null}

          <DefaultView style={styles.composerWrap}>
            <DefaultView style={styles.composer}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Nachricht schreiben..."
                placeholderTextColor={Colors.light.muted}
                returnKeyType="send"
                onSubmitEditing={sendMessage}
                editable={!isLoading}
                style={styles.input}
              />
              <Pressable style={styles.cameraButton}>
                <Icon name="camera" size={Sizes.icon.md} color={Colors.light.muted} />
              </Pressable>
            </DefaultView>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send message"
              disabled={!draft.trim() || isLoading}
              onPress={sendMessage}
              style={[styles.sendButton, (!draft.trim() || isLoading) && styles.sendButtonDisabled]}
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
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  messageText: {
    ...Typography.p1,
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
  input: {
    flex: 1,
    minHeight: Sizes.chat.composerHeight,
    color: Colors.light.text,
    ...Typography.p1,
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
