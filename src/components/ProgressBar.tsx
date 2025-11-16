import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, typography } from '../theme/colors';

interface ProgressBarProps {
  current: number;
  total: number;
  height?: number;
  showLabel?: boolean;
  color?: string;
  backgroundColor?: string;
  style?: any;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  height = 8,
  showLabel = true,
  color,
  backgroundColor = colors.border.light,
  style,
}) => {
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  
  // Determine color based on percentage
  let barColor = color;
  if (!barColor) {
    if (percentage >= 90) {
      barColor = colors.success;
    } else if (percentage >= 70) {
      barColor = colors.warning;
    } else {
      barColor = colors.error;
    }
  }

  return (
    <View style={[styles.container, style]}>
      {showLabel && (
        <Text style={styles.label}>
          {current}/{total} ({Math.round(percentage)}%)
        </Text>
      )}
      <View style={[styles.track, { height, backgroundColor }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              height,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  track: {
    width: '100%',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: borderRadius.full,
  },
});
