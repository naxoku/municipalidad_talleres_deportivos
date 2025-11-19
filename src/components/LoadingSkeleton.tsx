import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors, borderRadius } from '../theme/colors';

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  width = '100%', 
  height = 20, 
  borderRadius: br = borderRadius.md,
  style 
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: br,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <View style={styles.cardSkeleton}>
      <LoadingSkeleton width="60%" height={24} style={{ marginBottom: 8 }} />
      <LoadingSkeleton width="40%" height={16} style={{ marginBottom: 8 }} />
      <LoadingSkeleton width="80%" height={16} style={{ marginBottom: 8 }} />
      <View style={{ flexDirection: 'row', marginTop: 12 }}>
        <LoadingSkeleton width={80} height={32} style={{ marginRight: 8 }} />
        <LoadingSkeleton width={80} height={32} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.border.medium,
  },
  cardSkeleton: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 12,
  },
});
