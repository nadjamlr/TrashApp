import { Platform } from 'react-native';

const BASE_URL =
  process.env.EXPO_PUBLIC_CHAT_AGENT_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8004' : 'http://localhost:8004');

export type ConversationMessage = {
  role: 'assistant' | 'user';
  content: string;
};

export type ChatAskResponse = {
  response: string;
  suggested_location: { lat: number; lng: number } | null;
};

export async function askChatAgent(
  message: string,
  conversationHistory: ConversationMessage[],
): Promise<ChatAskResponse> {
  const response = await fetch(`${BASE_URL}/chat/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      conversation_history: conversationHistory,
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat agent error: ${response.status}`);
  }

  const data = (await response.json()) as ChatAskResponse;
  if (!data.response) {
    throw new Error('Chat response did not include a response message');
  }

  return data;
}
