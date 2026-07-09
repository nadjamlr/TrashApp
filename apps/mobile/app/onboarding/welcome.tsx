import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, Dimensions, Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Filter, FeTurbulence, FeColorMatrix, Rect } from 'react-native-svg';
import { useUser } from '@/context/UserContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Slide = {
  id: string;
  bgColor: string;
  textColor: string;
  gradient: readonly [string, string, ...string[]];
  image?: ImageSourcePropType;
  imageOffsetX?: number;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  iconColor?: string;
  title: string;
  description: string;
};

const slides: Slide[] = [
  {
    id: '1',
    bgColor: '#fde76a',
    textColor: '#060709',
    gradient: ['#f0d03d', '#f1dc66', '#e9e257'],
    image: require('@/assets/images/scan.png'),
    title: 'Richtig trennen,\nleicht gemacht',
    description: 'Scanne deinen Müll und finde sofort heraus, in welche Tonne er gehört – in Sekunden.',
  },
  {
    id: '2',
    bgColor: '#7edf69',
    textColor: '#060709',
    gradient: ['#3ee059', '#83ca87'],
    image: require('@/assets/images/recycle.png'),
    imageOffsetX: -10,
    title: 'Dein Beitrag\nzählt wirklich',
    description: 'Richtiges Recycling spart Energie, schont Rohstoffe und schützt das Klima.',
  },
  {
    id: '3',
    bgColor: '#ffffff',
    textColor: '#060709',
    gradient: ['#14a5e9', '#9dabc0'],
    image: require('@/assets/images/location.png'),
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
      {/* Full-screen gradient per slide, cross-fades on scroll */}
      {slides.map((item, index) => {
        const gradOpacity = scrollX.interpolate({
          inputRange: [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
          ],
          outputRange: [0, 1, 0],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View
            key={`grad-${item.id}`}
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { opacity: gradOpacity }]}
          >
            <LinearGradient
              colors={item.gradient}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        );
      })}

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
                {item.image ? (
                  <Image
                    source={item.image}
                    style={[styles.slideImage, item.imageOffsetX ? { transform: [{ translateX: item.imageOffsetX }] } : undefined]}
                    resizeMode="contain"
                  />
                ) : (
                  <FontAwesome name={item.icon!} size={80} color={item.iconColor} />
                )}
              </Animated.View>

              <Animated.View style={[styles.textArea, { opacity, transform: [{ translateY }] }]}>
                <Text style={[styles.title, { color: item.textColor }]}>{item.title}</Text>
                <Text style={[styles.description, { color: item.textColor, opacity: 0.8 }]}>
                  {item.description}
                </Text>
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

      {/* Global grain overlay – non-interactive, sits on top */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
          <Defs>
            <Filter id="grain-global">
              <FeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
              <FeColorMatrix type="saturate" values="0" />
            </Filter>
          </Defs>
          <Rect
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT}
            fill="white"
            filter="url(#grain-global)"
            opacity={0.1}
          />
        </Svg>
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
  slideImage: {
    width: 220,
    height: 220,
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
});
