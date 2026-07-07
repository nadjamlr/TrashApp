import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scrollRef = useRef<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const bgColor = scrollX.interpolate({
    inputRange: slides.map((_, i) => i * SCREEN_WIDTH),
    outputRange: slides.map((s) => s.bgColor),
  });

  async function handleSkip() {
    await completeOnboarding(null);
    router.replace('/(tabs)');
  }

  function handleNext() {
    if (currentIndex < slides.length - 1) {
      scrollRef.current?.scrollTo({ x: (currentIndex + 1) * SCREEN_WIDTH, animated: true });
    } else {
      router.push('/onboarding/city-selection');
    }
  }

  const currentSlide = slides[currentIndex];
  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <Animated.View style={[styles.container, { backgroundColor: bgColor }]}>
      <Pressable
        style={[styles.skipButton, { top: insets.top + 16 }]}
        onPress={handleSkip}
        hitSlop={12}
      >
        <Text style={[styles.skipText, { color: currentSlide.textColor }]}>Skip</Text>
      </Pressable>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(index);
        }}
      >
        {slides.map((item, index) => {
          const inputRange = [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
          ];
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0, 1, 0],
            extrapolate: 'clamp',
          });
          const translateY = scrollX.interpolate({
            inputRange,
            outputRange: [28, 0, 28],
            extrapolate: 'clamp',
          });

          return (
            <View key={item.id} style={[styles.slide, { width: SCREEN_WIDTH }]}>
              <Animated.View
                style={[styles.iconArea, { paddingTop: insets.top + 60, opacity, transform: [{ translateY }] }]}
              >
                <View style={styles.iconCircle}>
                  <FontAwesome name={item.icon} size={80} color={item.iconColor} />
                </View>
              </Animated.View>

              <Animated.View style={[styles.textArea, { opacity, transform: [{ translateY }] }]}>
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
              </Animated.View>
            </View>
          );
        })}
      </Animated.ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.dots}>
          {slides.map((_, i) => {
            const dotWidth = scrollX.interpolate({
              inputRange: [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH],
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange: [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH],
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { backgroundColor: currentSlide.textColor, width: dotWidth, opacity: dotOpacity }]}
              />
            );
          })}
        </View>

        <Pressable
          style={[styles.button, { backgroundColor: currentSlide.textColor }]}
          onPress={handleNext}
        >
          <Text style={[styles.buttonText, { color: currentSlide.bgColor }]}>
            {isLastSlide ? "Los geht's" : 'Weiter'}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    right: 24,
    zIndex: 10,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
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
});
