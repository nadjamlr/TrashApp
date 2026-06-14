import { Platform } from 'react-native';

const BASE_URL =
  process.env.EXPO_PUBLIC_VISION_AGENT_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8001' : 'http://localhost:8001');

export type VisionResult = {
  label: string;
  material: string;
  confidence: number;
};

export async function identifyImage(uri: string): Promise<VisionResult> {
  const filename = uri.split('/').pop() ?? 'image.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  const body = new FormData();
  body.append('image', { uri, name: filename, type } as unknown as Blob);

  const response = await fetch(`${BASE_URL}/vision/identify`, {
    method: 'POST',
    body,
  });

  if (!response.ok) {
    throw new Error(`Vision agent error: ${response.status}`);
  }

  return response.json() as Promise<VisionResult>;
}
