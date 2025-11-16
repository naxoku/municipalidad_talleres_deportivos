import React from 'react';
import { View, Text } from 'react-native';
import { colors, spacing, typography } from '../theme/colors';

export default function SimpleBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <View style={{ padding: spacing.sm, backgroundColor: '#fff', borderRadius: 8 }}>
      {data.map((d, i) => (
        <View key={i} style={{ marginBottom: spacing.sm }}>
          <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary }}>{d.label}</Text>
          <View style={{ height: 10, backgroundColor: colors.accent.green + '33', borderRadius: 6, overflow: 'hidden', marginTop: 6 }}>
            <View style={{ width: `${Math.round((d.value / max) * 100)}%`, height: '100%', backgroundColor: colors.accent.green }} />
          </View>
        </View>
      ))}
    </View>
  );
}
