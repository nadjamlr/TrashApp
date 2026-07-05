import { Platform } from 'react-native';

const BASE_URL =
  process.env.EXPO_PUBLIC_INSIGHT_AGENT_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8003' : 'http://localhost:8003');

export type InsightResult = {
  fact: string;
  category: string;
};

export async function generateInsight(
  label: string,
  material: string,
  bin: string,
): Promise<InsightResult> {
  const response = await fetch(`${BASE_URL}/insights/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label, material, bin }),
  });
  if (!response.ok) {
    throw new Error(`Insight agent error: ${response.status}`);
  }
  return response.json();
}
