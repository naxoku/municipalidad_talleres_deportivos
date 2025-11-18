import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DesignShowcase } from '../src/components/DesignShowcase';
import { colors, spacing, typography } from '../src/theme/colors';

export default function DesignShowcaseScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎨 Design Showcase</Text>
        <Text style={styles.subtitle}>Sistema de diseño de la app</Text>
      </View>
      <DesignShowcase />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
});