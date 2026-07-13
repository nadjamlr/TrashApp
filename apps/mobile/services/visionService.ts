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

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.timeout = 360_000;
    xhr.open('POST', `${BASE_URL}/vision/identify`);
    xhr.responseType = 'json';

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response as VisionResult);
      } else {
        reject(new Error(`Vision agent error: ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Vision agent network error'));
    xhr.ontimeout = () => reject(new Error('Vision agent timed out'));

    xhr.send(body);
  });
}
