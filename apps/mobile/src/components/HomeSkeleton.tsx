import React, { memo } from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { colors } from '@theme/index';

const { width, height } = Dimensions.get('window');

function HomeSkeleton() {
  return (
    <ScrollView style={styles.container} scrollEnabled={false}>
      <SkeletonPlaceholder
        backgroundColor={colors.bgSurface}
        highlightColor={colors.bgOverlay}
        speed={1200}
      >
        {/* Hero banner */}
        <SkeletonPlaceholder.Item width={width} height={height * 0.55} />

        {/* Row title */}
        <SkeletonPlaceholder.Item
          marginTop={24}
          marginLeft={16}
          width={140}
          height={20}
          borderRadius={4}
        />
        {/* Movie cards row */}
        <SkeletonPlaceholder.Item
          flexDirection="row"
          marginTop={12}
          marginLeft={16}
        >
          {[1, 2, 3, 4].map((i) => (
            <SkeletonPlaceholder.Item key={i} marginRight={12}>
              <SkeletonPlaceholder.Item width={110} height={165} borderRadius={12} />
              <SkeletonPlaceholder.Item marginTop={6} width={90} height={12} borderRadius={4} />
            </SkeletonPlaceholder.Item>
          ))}
        </SkeletonPlaceholder.Item>

        {/* Second row title */}
        <SkeletonPlaceholder.Item
          marginTop={24}
          marginLeft={16}
          width={120}
          height={20}
          borderRadius={4}
        />
        <SkeletonPlaceholder.Item
          flexDirection="row"
          marginTop={12}
          marginLeft={16}
        >
          {[1, 2, 3, 4].map((i) => (
            <SkeletonPlaceholder.Item key={i} marginRight={12}>
              <SkeletonPlaceholder.Item width={110} height={165} borderRadius={12} />
              <SkeletonPlaceholder.Item marginTop={6} width={90} height={12} borderRadius={4} />
            </SkeletonPlaceholder.Item>
          ))}
        </SkeletonPlaceholder.Item>
      </SkeletonPlaceholder>
    </ScrollView>
  );
}

export default memo(HomeSkeleton);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
});
