import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';

const SW = Dimensions.get('window').width;

export function ShimmerBlock({
  w, h, round = 8, color = 'rgba(0,0,0,0.08)',
}: {
  w: number | string;
  h: number;
  round?: number;
  color?: string;
}) {
  const op = useRef(new Animated.Value(0.25)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(op, { toValue: 0.55, duration: 700, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.25, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [op]);
  return (
    <Animated.View
      style={{
        width: w as any,
        height: h,
        borderRadius: round,
        backgroundColor: color,
        opacity: op,
      }}
    />
  );
}

export function GenericScreenShimmer({ color = 'rgba(0,0,0,0.08)' }: { color?: string }) {
  const cw = SW - 40;
  return (
    <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24 }}>
      <ShimmerBlock w={cw * 0.5} h={14} round={6} color={color} />
      <View style={{ height: 12 }} />
      <ShimmerBlock w={cw * 0.8} h={24} round={8} color={color} />
      <View style={{ height: 8 }} />
      <ShimmerBlock w={cw * 0.6} h={14} round={6} color={color} />

      <View style={{ height: 28 }} />
      <ShimmerBlock w={cw} h={120} round={16} color={color} />
      <View style={{ height: 16 }} />
      <ShimmerBlock w={cw} h={120} round={16} color={color} />

      <View style={{ height: 28 }} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <ShimmerBlock w={(cw - 12) / 2} h={56} round={12} color={color} />
        <ShimmerBlock w={(cw - 12) / 2} h={56} round={12} color={color} />
      </View>

      <View style={{ height: 20 }} />
      <ShimmerBlock w={cw * 0.4} h={14} round={6} color={color} />
      <View style={{ height: 8 }} />
      <ShimmerBlock w={cw} h={80} round={12} color={color} />
    </View>
  );
}

export function CardShimmer({ color = 'rgba(0,0,0,0.08)' }: { color?: string }) {
  const cw = SW - 40;
  return (
    <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24 }}>
      <ShimmerBlock w={cw * 0.4} h={12} round={6} color={color} />
      <View style={{ height: 10 }} />
      <ShimmerBlock w={cw * 0.7} h={28} round={10} color={color} />
      <View style={{ height: 24 }} />
      <ShimmerBlock w={cw} h={160} round={16} color={color} />
      <View style={{ height: 16 }} />
      <ShimmerBlock w={cw} h={160} round={16} color={color} />
      <View style={{ height: 24 }} />
      <ShimmerBlock w={cw} h={52} round={26} color={color} />
    </View>
  );
}

export function ListShimmer({ rows = 5, color = 'rgba(0,0,0,0.08)' }: { rows?: number; color?: string }) {
  const cw = SW - 40;
  return (
    <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24 }}>
      <ShimmerBlock w={cw * 0.5} h={16} round={6} color={color} />
      <View style={{ height: 16 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <ShimmerBlock w={40} h={40} round={10} color={color} />
          <View style={{ flex: 1, gap: 6 }}>
            <ShimmerBlock w="70%" h={14} round={6} color={color} />
            <ShimmerBlock w="45%" h={10} round={4} color={color} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function SliderShimmer({ color = 'rgba(0,0,0,0.08)' }: { color?: string }) {
  const cw = SW - 40;
  return (
    <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12 }}>
      <View style={{ alignItems: 'center', marginBottom: 28 }}>
        <ShimmerBlock w={cw * 0.75} h={36} round={12} color={color} />
        <View style={{ height: 8 }} />
        <ShimmerBlock w={cw * 0.55} h={36} round={12} color={color} />
      </View>
      <View style={{ alignItems: 'center', marginBottom: 12, gap: 12, paddingVertical: 16 }}>
        <ShimmerBlock w={200} h={44} round={10} color={color} />
        <ShimmerBlock w={Math.min(220, SW * 0.6)} h={4} round={2} color={color} />
        <ShimmerBlock w={100} h={14} round={6} color={color} />
      </View>
      <View style={{ alignItems: 'center', gap: 12, paddingVertical: 16 }}>
        <ShimmerBlock w={80} h={44} round={10} color={color} />
        <ShimmerBlock w={Math.min(160, SW * 0.45)} h={4} round={2} color={color} />
        <ShimmerBlock w={120} h={14} round={6} color={color} />
      </View>
      <View style={{ height: 32 }} />
      <ShimmerBlock w={cw} h={52} round={26} color={color} />
    </View>
  );
}
