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
  // TODO: replace with real call once Insight Agent is deployed (see issue #16)
  return {
    fact: 'Recycling Aluminium spart bis zu 95% Energie im Vergleich zur Neuproduktion.',
    category: 'energy',
  };
}
