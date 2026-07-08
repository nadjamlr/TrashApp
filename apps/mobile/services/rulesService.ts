import { Platform } from 'react-native';

const BASE_URL =
  process.env.EXPO_PUBLIC_RULES_AGENT_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8002' : 'http://localhost:8002');

export type RulesResult = {
  bin: string;
  reasoning: string;
  deposit: string | null;
  alternatives: string[];
  important_notes: string[];
};

export async function classifyItem(
  label: string,
  material: string,
): Promise<RulesResult> {
  const response = await fetch(`${BASE_URL}/rules/classify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label, material, city: 'munich' }),
  });
  if (!response.ok) {
    throw new Error(`Rules agent error: ${response.status}`);
  }
  return response.json();
}
