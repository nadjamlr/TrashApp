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
  // TODO: replace with real call once Rules Agent is deployed (see issue #15)
  return {
    bin: 'Pfand',
    reasoning: 'Aluminium-Dosen mit Pfandzeichen gehören zum Pfandsystem.',
    deposit: '0,25 €',
    alternatives: ['Gelber Sack (ohne Pfand)'],
    important_notes: ['Vor Entsorgung ausleeren', 'Nicht zerdrücken'],
  };
}
