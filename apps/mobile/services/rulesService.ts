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
  try {
    const response = await fetch(`${BASE_URL}/rules/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, material, city: 'munich' }),
    });

    if (!response.ok) {
      throw new Error(`Rules service returned ${response.status}`);
    }

    return await response.json();
  } catch {
    return classifyWithLocalFallback(label, material);
  }
}

function classifyWithLocalFallback(label: string, material: string): RulesResult {
  const query = `${label} ${material}`.toLocaleLowerCase();

  if (/(sandwich|brot|brötchen|bread|food|essen|leftover|speiserest)/i.test(query)) {
    return {
      bin: 'Biotonne',
      reasoning:
        'Das sieht nach Küchen- oder Speiseresten aus. In München gehören gekochte und rohe Speisereste sowie Brot in die Biotonne.',
      deposit: null,
      alternatives: ['Eigenkompostierung, falls geeignet'],
      important_notes: [
        'Keine Plastiktüten oder kompostierbaren Plastik-Biobeutel in die Biotonne geben.',
      ],
    };
  }

  return {
    bin: 'Restmuelltonne',
    reasoning:
      'Der Rules Agent ist gerade nicht erreichbar und die lokale App-Fallbacklogik kennt diesen Gegenstand nicht sicher.',
    deposit: null,
    alternatives: ['Rules Agent erneut versuchen', 'AWM Abfall-ABC prüfen'],
    important_notes: ['Nicht als Pfand oder Verpackung behandeln, solange die Zuordnung unsicher ist.'],
  };
}
