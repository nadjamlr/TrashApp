export type HapticEvent =
  | 'sendMessage'
  | 'botResponse'
  | 'voiceStart'
  | 'voiceStop';

export async function triggerHaptic(event: HapticEvent): Promise<void> {
  try {
    const Haptics = await import('expo-haptics');
    switch (event) {
      case 'sendMessage':
      case 'voiceStop':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      case 'voiceStart':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        return;
      case 'botResponse':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
    }
  } catch {
    // Native module unavailable — no-op.
  }
}
