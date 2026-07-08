export type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  bullets?: string[];
  actions?: string[];
};
