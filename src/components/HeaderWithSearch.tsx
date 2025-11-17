import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from './SearchBar';
import { useAuth } from '../contexts/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { colors, spacing, typography, borderRadius, shadows } from '../theme/colors';

interface Props {
  title: string;
  searchTerm?: string;
  onSearch?: (v: string) => void;
  onAdd?: (() => void) | undefined;
}

const HeaderWithSearch: React.FC<Props> = ({ title, searchTerm = '', onSearch, onAdd }) => {
  const { isWeb, isMobile } = useResponsive();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'administrador';

  const [viewMode, setViewMode] = React.useState<'cards' | 'table'>('cards');

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerActions}>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewToggleButton, viewMode === 'cards' && styles.viewToggleButtonActive]}
              onPress={() => setViewMode('cards')}
            >
              <Ionicons name="grid" size={20} color={viewMode === 'cards' ? colors.primary : colors.text.tertiary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleButton, viewMode === 'table' && styles.viewToggleButtonActive]}
              onPress={() => setViewMode('table')}
            >
              <Ionicons name="list" size={20} color={viewMode === 'table' ? colors.primary : colors.text.tertiary} />
            </TouchableOpacity>
          </View>
          {isAdmin && onAdd && (
            <TouchableOpacity style={styles.addButton} onPress={onAdd}>
              <Ionicons name="add" size={20} color={colors.text.light} />
              <Text style={styles.addButtonText}>Nuevo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {onSearch && (
        <View style={styles.searchContainer}>
          <SearchBar value={searchTerm} onChange={onSearch} placeholder={`Buscar ${title.toLowerCase()}...`} onClear={() => onSearch('')} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: 2,
    gap: 2,
  },
  viewToggleButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: 'transparent',
  },
  viewToggleButtonActive: {
    backgroundColor: colors.background.primary,
    ...(shadows.sm as any),
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginLeft: spacing.sm,
  },
  addButtonText: {
    color: colors.text.light,
    fontWeight: '600',
    fontSize: typography.sizes.md,
    marginLeft: spacing.xs,
  },
  searchContainer: {
    marginTop: spacing.sm,
    width: '100%'
  }
});

export default HeaderWithSearch;
