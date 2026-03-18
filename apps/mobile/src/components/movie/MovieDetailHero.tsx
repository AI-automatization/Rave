// CineSync Mobile — Movie Detail: Parallax Hero
import React from 'react';
import { StyleSheet, Dimensions, Animated } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@theme/index';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const HEADER_HEIGHT = 280;

interface MovieDetailHeroProps {
  backdropUrl?: string;
  headerHeight?: number;
  scrollY: Animated.Value;
}

export const MovieDetailHero = React.memo<MovieDetailHeroProps>(
  ({ backdropUrl, headerHeight = HEADER_HEIGHT, scrollY }) => {
    const headerTranslate = scrollY.interpolate({
      inputRange: [0, headerHeight],
      outputRange: [0, -headerHeight / 3],
      extrapolate: 'clamp',
    });

    const imageOpacity = scrollY.interpolate({
      inputRange: [0, headerHeight * 0.7],
      outputRange: [1, 0.2],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[styles.headerContainer, { height: headerHeight, transform: [{ translateY: headerTranslate }] }]}
      >
        <Animated.View style={{ opacity: imageOpacity, flex: 1 }}>
          <Image
            source={{ uri: backdropUrl }}
            style={[styles.backdrop, { height: headerHeight }]}
            contentFit="cover"
          />
        </Animated.View>
        <LinearGradient
          colors={['transparent', colors.bgBase]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0.4 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>
    );
  },
);

MovieDetailHero.displayName = 'MovieDetailHero';

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    overflow: 'hidden',
  },
  backdrop: { width: SCREEN_WIDTH },
});
