import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ShimmerBlockProps = {
  width: number | string;
  height: number;
  style?: object;
};

function ShimmerBlock({ width, height, style }: ShimmerBlockProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.block,
        { width, height, opacity },
        style,
      ]}
    />
  );
}

export default function ShimmerPlaceholder() {
  const cardWidth = SCREEN_WIDTH - 40;
  const isSmall = SCREEN_WIDTH < 380;

  return (
    <View style={styles.container}>
      {/* Title line */}
      <ShimmerBlock width={cardWidth * 0.85} height={isSmall ? 22 : 26} style={styles.title} />
      {/* Amount block */}
      <ShimmerBlock width={120} height={isSmall ? 36 : 44} style={styles.amount} />
      <ShimmerBlock width={140} height={16} style={styles.subtitle} />
      {/* Card placeholders */}
      <ShimmerBlock width={cardWidth} height={isSmall ? 72 : 88} style={styles.card} />
      <ShimmerBlock width={cardWidth} height={isSmall ? 72 : 88} style={styles.card} />
      <ShimmerBlock width={cardWidth} height={isSmall ? 72 : 88} style={styles.card} />
      <ShimmerBlock width={cardWidth} height={isSmall ? 56 : 64} style={styles.card} />
      {/* Bottom bar */}
      <ShimmerBlock width={cardWidth} height={52} style={styles.bottomBar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  block: {
    backgroundColor: '#E8E8E8',
    borderRadius: 8,
  },
  title: {
    marginBottom: 28,
  },
  amount: {
    marginBottom: 10,
  },
  subtitle: {
    marginBottom: 28,
  },
  card: {
    marginBottom: 16,
  },
  bottomBar: {
    marginTop: 28,
    borderRadius: 26,
  },
});
