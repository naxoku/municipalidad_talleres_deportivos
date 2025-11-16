import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, colors } from '../theme/colors';

interface Action {
  icon: string;
  title: string;
  onPress?: () => void;
}

export default function QuickActions({ actions }: { actions: Action[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginVertical: spacing.sm }}>
      {actions.map((a, i) => (
        <TouchableOpacity
          key={i}
          onPress={a.onPress}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: spacing.sm,
            marginRight: spacing.sm,
            marginBottom: spacing.sm,
            backgroundColor: colors.primarySoft,
            borderRadius: 8,
          }}
        >
          <Ionicons name={a.icon as any} size={18} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={{ color: colors.text.primary }}>{a.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
