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
import { useLocation } from '@/context/LocationContext';
import { askChatAgent, ConversationMessage } from '@/services/chatService';
import { triggerHaptic } from '@/services/haptics';
import { fetchLocations, Location } from '@/services/locationsService';

const initialMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content:
      'Hallo! Ich bin dein Abfall-Assistent. Frag mich alles zur Muelltrennung, zum Recycling oder zur richtigen Entsorgung.',
  },
];

function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1000) return `${Math.round(distanceMeters)} m`;
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

function formatNearestLocations(locations: Location[]): string {
  if (locations.length === 0) {
    return 'In der Nähe habe ich keine Wertstoffinsel oder Wertstoffhof gefunden. Vielleicht ist der Radius zu klein.';
  }

  const sorted = [...locations].sort((a, b) => a.distance_m - b.distance_m);
  const nearestInsel = sorted.find((location) => location.type === 'wertstoffinsel');
  const nearestHof = sorted.find((location) => location.type === 'wertstoffhof');

  const lines: string[] = [];
  if (nearestInsel) {
    lines.push(
      `Nächste Wertstoffinsel: ${nearestInsel.name} — ${nearestInsel.address} (${formatDistance(nearestInsel.distance_m)})`,
    );
  }
  if (nearestHof) {
    lines.push(
      `Nächster Wertstoffhof: ${nearestHof.name} — ${nearestHof.address} (${formatDistance(nearestHof.distance_m)})`,
    );
  }
  if (lines.length === 0) {
    const nearest = sorted[0];
    lines.push(
      `Nächster Standort: ${nearest.name} — ${nearest.address} (${formatDistance(nearest.distance_m)})`,
    );
  }
  return lines.join('\n');
}

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFindingNearest, setIsFindingNearest] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const userLocation = useLocation();
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
    void triggerHaptic('sendMessage');
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
      void triggerHaptic('botResponse');
      requestAnimationFrame(() => scrollViewRef.current?.scrollToEnd({ animated: true }));
    } catch {
      setErrorMessage('Could not reach the waste assistant. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const findNearestDisposalSpots = async () => {
    if (isFindingNearest || isLoading) return;

    if (userLocation.error) {
      setErrorMessage('Standortzugriff nicht möglich. Bitte in den Einstellungen erlauben.');
      return;
    }

    setErrorMessage(null);
    setIsFindingNearest(true);
    void triggerHaptic('sendMessage');

    const promptMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: 'Wo ist die nächste Wertstoffinsel oder der nächste Wertstoffhof?',
    };
    setMessages((currentMessages) => [...currentMessages, promptMessage]);
    requestAnimationFrame(() => scrollViewRef.current?.scrollToEnd({ animated: true }));

    try {
      const locations = await fetchLocations({
        lat: userLocation.lat,
        lng: userLocation.lng,
        radius: 5000,
      });
      const answer = formatNearestLocations(locations);
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: answer,
        },
      ]);
      void triggerHaptic('botResponse');
      requestAnimationFrame(() => scrollViewRef.current?.scrollToEnd({ animated: true }));
    } catch {
      setErrorMessage('Konnte den Standort-Service nicht erreichen.');
    } finally {
      setIsFindingNearest(false);
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
          isFindingNearest={isFindingNearest}
          bottom={composerBottom}
          onChangeDraft={setDraft}
          onSend={sendMessage}
          onFindNearest={findNearestDisposalSpots}
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
