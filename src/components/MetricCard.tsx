import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../theme/colors';

interface Props {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  onPress?: () => void;
}

export default function MetricCard({ title, value, icon, color, onPress }: Props) {
  const Container: any = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      style={{
        flex: 1,
        minWidth: 160,
        backgroundColor: '#fff',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        margin: spacing.sm,
        ...(shadows as any).md,
        borderLeftWidth: 4,
        borderLeftColor: color || colors.accent.green,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary }}>{title}</Text>
          <Text style={{ fontSize: typography.sizes.xxl, fontWeight: '700', color: colors.text.primary }}>{value}</Text>
        </View>
        <View>{icon}</View>
      </View>
    </Container>
  );
}
