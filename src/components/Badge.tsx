import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, typography } from '../theme/colors';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export const Badge: React.FC<BadgeProps> = ({ 
  label, 
  variant = 'default', 
  size = 'medium',
  style 
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return { backgroundColor: '#e6f4ed', color: colors.success };
      case 'warning':
        return { backgroundColor: '#fff4e5', color: colors.warning };
      case 'error':
        return { backgroundColor: '#fff4f4', color: colors.error };
      case 'info':
        return { backgroundColor: colors.blue.soft, color: colors.blue.main };
      default:
        return { backgroundColor: colors.background.tertiary, color: colors.text.secondary };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, fontSize: typography.sizes.xs };
      case 'large':
        return { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: typography.sizes.md };
      default:
        return { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, fontSize: typography.sizes.sm };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <View style={[styles.badge, { backgroundColor: variantStyles.backgroundColor }, style]}>
      <Text style={[styles.text, { color: variantStyles.color, fontSize: sizeStyles.fontSize }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});
