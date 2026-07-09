import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatComposer } from '@/components/chat/ChatComposer';
import { ChatMessageList } from '@/components/chat/ChatMessageList';
import type { ChatMessage } from '@/components/chat/types';
import { Text, View } from '@/components/themes/Themed';
import { Layout } from '@/constants/Layout';
import { Sizes } from '@/constants/Sizes';
import { Spacing } from '@/constants/Spacing';
import { askChatAgent, ConversationMessage } from '@/services/chatService';

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
  const composerBottom = keyboardHeight ? keyboardHeight + Spacing.md : Layout.chatComposerBottomOffset;
  const scrollBottomPadding = composerBottom + Sizes.chat.composerHeight + Spacing.xl;

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

  useEffect(() => {
    requestAnimationFrame(() => scrollViewRef.current?.scrollToEnd({ animated: true }));
  }, [messages, isLoading, keyboardHeight]);

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
      const data = await askChatAgent(trimmedDraft, conversationHistory);
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
        style={styles.keyboardView}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + Spacing.lg,
              paddingBottom: scrollBottomPadding,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text variant="h1" style={styles.title}>
            Chatbot
          </Text>

          <ChatMessageList messages={messages} isLoading={isLoading} />
        </ScrollView>

        <ChatComposer
          draft={draft}
          errorMessage={errorMessage}
          isLoading={isLoading}
          bottom={composerBottom}
          onChangeDraft={setDraft}
          onSend={sendMessage}
        />
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
  },
  title: {
    marginBottom: Spacing.lg,
  },
});
