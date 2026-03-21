// CineSync Mobile — Onboarding Screen (refactored)
import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createThemedStyles } from '@theme/index';
import { AuthStackParamList } from '@app-types/index';
import { useOnboardingAnimations } from '@hooks/useOnboardingAnimations';
import { SLIDES, Slide } from '@components/auth/onboardingSlides';
import { OnboardingSlide } from '@components/auth/OnboardingSlide';
import { OnboardingFooter } from '@components/auth/OnboardingFooter';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

export function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const flatListRef = useRef<FlatList<Slide>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { floatAnim, iconScale, floatTranslate, animateIconPop } =
    useOnboardingAnimations();
  const styles = useStyles();

  const goNext = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIdx = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIdx });
      setCurrentIndex(nextIdx);
      animateIconPop();
    } else {
      navigation.replace('Login');
    }
  }, [currentIndex, animateIconPop, navigation]);

  const handleSkip = useCallback(() => {
    navigation.replace('Login');
  }, [navigation]);

  const handleScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / width);
      if (index !== currentIndex && index >= 0 && index < SLIDES.length) {
        setCurrentIndex(index);
        animateIconPop();
      }
    },
    [currentIndex, animateIconPop],
  );

  const renderSlide = useCallback(
    ({ item }: { item: Slide }) => (
      <OnboardingSlide
        item={item}
        floatAnim={floatAnim}
        iconScale={iconScale}
        floatTranslate={floatTranslate}
      />
    ),
    [floatAnim, iconScale, floatTranslate],
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [],
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled
        onMomentumScrollEnd={handleScroll}
        getItemLayout={getItemLayout}
      />

      <OnboardingFooter
        currentIndex={currentIndex}
        accentColor={SLIDES[currentIndex].accentColor}
        onNext={goNext}
        onSkip={handleSkip}
      />
    </View>
  );
}

function keyExtractor(item: Slide): string {
  return item.id;
}

const useStyles = createThemedStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
}));
