import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View, ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '@/context/UserContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Slide = {
  id: string;
  bgColor: string;
  textColor: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  iconColor: string;
  title: string;
  description: string;
  stat?: string;
  statLabel?: string;
};

const slides: Slide[] = [
  {
    id: '1',
    bgColor: '#FEDA10',
    textColor: '#21242C',
    icon: 'recycle',
    iconColor: '#21242C',
    title: 'Richtig trennen,\nleicht gemacht',
    description: 'Scanne deinen Müll und finde sofort heraus, in welche Tonne er gehört – in Sekunden.',
    stat: '60 %',
    statLabel: 'des Hausmülls wäre recycelbar, landet aber im Restmüll',
  },
  {
    id: '2',
    bgColor: '#38632E',
    textColor: '#FFFFFF',
    icon: 'leaf',
    iconColor: '#FEDA10',
    title: 'Dein Beitrag\nzählt wirklich',
    description: 'Richtiges Recycling spart Energie, schont Rohstoffe und schützt das Klima.',
    stat: '95 %',
    statLabel: 'weniger Energie braucht recyceltes Aluminium gegenüber Neuproduktion',
  },
  {
    id: '3',
    bgColor: '#21242C',
    textColor: '#FFFFFF',
    icon: 'map-marker',
    iconColor: '#FEDA10',
    title: 'Deine Stadt,\ndeine Regeln',
    description: 'TrashApp kennt die aktuellen Trennungsregeln deiner Stadt – immer dabei.',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useUser();
  const flatListRef = useRef<FlatList<Slide>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentIndex(viewableItems[0].index);
    }
  });

  async function handleSkip() {
    await completeOnboarding(null);
    router.replace('/(tabs)');
  }

  function handleNext() {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      router.push('/onboarding/city-selection');
    }
  }

  const currentSlide = slides[currentIndex];
  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig.current}
        renderItem={({ item }) => (
          <View style={[styles.slide, { backgroundColor: item.bgColor, width: SCREEN_WIDTH }]}>
            <View style={[styles.iconArea, { paddingTop: insets.top + 60 }]}>
              <View style={styles.iconCircle}>
                <FontAwesome name={item.icon} size={80} color={item.iconColor} />
              </View>
            </View>
            <View style={styles.textArea}>
              <Text style={[styles.title, { color: item.textColor }]}>{item.title}</Text>
              <Text style={[styles.description, { color: item.textColor, opacity: 0.8 }]}>
                {item.description}
              </Text>
              {item.stat && (
                <View style={[styles.statBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                  <Text style={[styles.statNumber, { color: item.textColor }]}>{item.stat}</Text>
                  <Text style={[styles.statLabel, { color: item.textColor, opacity: 0.75 }]}>
                    {item.statLabel}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      />

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 24, backgroundColor: currentSlide.bgColor }]}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: currentSlide.textColor },
                i === currentIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <Pressable
          style={[styles.button, { backgroundColor: currentSlide.textColor }]}
          onPress={handleNext}
        >
          <Text style={[styles.buttonText, { color: currentSlide.bgColor }]}>
            {isLastSlide ? "Los geht's" : 'Weiter'}
          </Text>
        </Pressable>

        <Pressable style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: currentSlide.textColor, opacity: 0.5 }]}>
            Überspringen
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
  },
  iconArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArea: {
    paddingHorizontal: 32,
    paddingBottom: 32,
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  bottomBar: {
    paddingTop: 20,
    paddingHorizontal: 32,
    gap: 20,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    opacity: 1,
  },
  dotInactive: {
    width: 8,
    opacity: 0.3,
  },
  button: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  statBadge: {
    marginTop: 4,
    borderRadius: 12,
    padding: 12,
    gap: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
  },
});
