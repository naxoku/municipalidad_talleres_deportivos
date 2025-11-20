import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SearchBar } from './SearchBar';
import { useAuth } from '../contexts/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { colors, spacing, typography, borderRadius, shadows } from '../theme/colors';
import { BUTTON_HEIGHT } from '../theme/sharedStyles';

interface Props {
  title: string;
  searchTerm?: string;
  onSearch?: (v: string) => void;
  onAdd?: (() => void) | undefined;
  viewMode?: 'cards' | 'table' | 'calendar' | 'dayView';
  onViewModeChange?: (mode: 'cards' | 'table' | 'calendar' | 'dayView') => void;
}

const HeaderWithSearch: React.FC<Props> = ({ 
  title, 
  searchTerm = '', 
  onSearch, 
  onAdd,
  viewMode: externalViewMode,
  onViewModeChange 
}) => {
  const { isMobile } = useResponsive();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'administrador';

  const [internalViewMode, setInternalViewMode] = React.useState<'cards' | 'table' | 'calendar' | 'dayView'>('cards');
  
  // Use external viewMode if provided, otherwise use internal state
  const viewMode = externalViewMode !== undefined ? externalViewMode : internalViewMode;
  const setViewMode = onViewModeChange || setInternalViewMode;

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        {onSearch ? (
          <View style={styles.inlineSearch}>
            <SearchBar
              value={searchTerm}
              onChange={onSearch}
              placeholder={`Buscar ${title.toLowerCase()}...`}
              onClear={() => onSearch('')}
            />
          </View>
        ) : (
          <Text style={styles.headerTitle}>{title}</Text>
        )}
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
            <TouchableOpacity
              style={[styles.addButton, isMobile && styles.addButtonIconOnly]}
              onPress={onAdd}
              accessibilityRole="button"
              accessible={true}
              accessibilityLabel={`Nuevo ${title}`}
              accessibilityHint={`Crear ${title.toLowerCase()}`}
            >
              <Ionicons name="add" size={20} color={colors.text.light} />
              {!isMobile && <Text style={styles.addButtonText}>Nuevo</Text>}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* search is rendered inline in headerRow now */}
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
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginLeft: spacing.sm,
    minHeight: BUTTON_HEIGHT,
  },
  addButtonText: {
    color: colors.text.light,
    fontWeight: '600',
    fontSize: typography.sizes.sm,
    marginLeft: spacing.xs,
    lineHeight: 18,
  },
  searchContainer: {
    marginTop: spacing.sm,
    width: '100%'
  }
  ,
  inlineSearch: {
    flex: 1,
    marginRight: spacing.md,
    alignSelf: 'stretch',
  }
  ,
  addButtonIconOnly: {
    width: BUTTON_HEIGHT,
    minHeight: BUTTON_HEIGHT,
    paddingHorizontal: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  }
});

export default HeaderWithSearch;
