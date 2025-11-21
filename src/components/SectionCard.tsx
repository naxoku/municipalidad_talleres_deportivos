import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, typography, shadows } from '../theme/colors';

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  rightElement?: React.ReactNode;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  children,
  collapsible = false,
  defaultCollapsed = false,
  rightElement,
  icon,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const toggleCollapse = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggleCollapse}
        disabled={!collapsible}
        activeOpacity={collapsible ? 0.7 : 1}
        accessibilityRole={collapsible ? 'button' : 'none'}
        accessibilityLabel={`${title}${collapsible ? (isCollapsed ? ', expandir' : ', colapsar') : ''}`}
      >
        <View style={styles.headerLeft}>
          {icon && (
            <Ionicons name={icon} size={20} color={colors.primary} />
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.headerRight}>
          {rightElement}
          {collapsible && (
            <Ionicons
              name={isCollapsed ? 'chevron-down' : 'chevron-up'}
              size={20}
              color={colors.text.secondary}
            />
          )}
        </View>
      </TouchableOpacity>
      {!isCollapsed && <View style={styles.content}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background.secondary,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer' as any,
    }),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  content: {
    padding: spacing.lg,
  },
});
