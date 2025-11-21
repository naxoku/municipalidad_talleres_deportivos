import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme/colors';
import { ListViewProps } from '../types/entityTypes';

export default function ListView({
  entityType,
  data,
  onItemPress,
  onCreate,
  onSearch,
  loading = false,
  renderItemActions
}: ListViewProps) {

  const getEntityTitle = () => {
    switch (entityType) {
      case 'taller': return 'Talleres';
      case 'alumno': return 'Alumnos';
      case 'profesor': return 'Profesores';
      default: return 'Entidades';
    }
  };

  const getEntityIcon = () => {
    switch (entityType) {
      case 'taller': return 'book-outline';
      case 'alumno': return 'person-outline';
      case 'profesor': return 'school-outline';
      default: return 'list-outline';
    }
  };

  const getAccentColor = () => {
    switch (entityType) {
      case 'taller': return colors.primary;
      case 'alumno': return colors.success;
      case 'profesor': return colors.info;
      default: return colors.primary;
    }
  };

  const accentColor = getAccentColor();

  const renderItem = ({ item }: { item: any }) => {
    let title = '';
    let subtitle = '';
    let badge = null;

    if (entityType === 'taller') {
      title = item.nombre;
      subtitle = item.descripcion || 'Sin descripción';
      const occupancy = item.total_alumnos && item.cupos_maximos ?
        Math.round((item.total_alumnos / item.cupos_maximos) * 100) : 0;
      badge = occupancy >= 80 ? 'Lleno' : occupancy >= 50 ? 'Medio' : 'Disponible';
    } else if (entityType === 'alumno') {
      title = `${item.nombres} ${item.apellidos || ''}`.trim();
      subtitle = item.email || item.telefono || 'Sin contacto';
      badge = item.talleres ? `${item.talleres.length} talleres` : null;
    } else if (entityType === 'profesor') {
      title = item.nombre;
      subtitle = item.especialidad;
      badge = item.talleres ? `${item.talleres.length} talleres` : null;
    }

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => onItemPress?.(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.itemIcon, { backgroundColor: accentColor + '20' }]}>
          <Ionicons name={getEntityIcon()} size={20} color={accentColor} />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.itemSubtitle} numberOfLines={1}>{subtitle}</Text>
        </View>
        {badge && (
          <View style={[styles.badge, { backgroundColor: accentColor + '30' }]}>
            <Text style={[styles.badgeText, { color: accentColor }]}>{badge}</Text>
          </View>
        )}
        {renderItemActions ? (
          renderItemActions(item)
        ) : (
          <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name={getEntityIcon()} size={48} color={colors.text.tertiary} />
      <Text style={styles.emptyTitle}>No hay {getEntityTitle().toLowerCase()}</Text>
      <Text style={styles.emptySubtitle}>
        {onCreate ? 'Crea el primero para comenzar' : 'No se encontraron resultados'}
      </Text>
      {onCreate && (
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: accentColor }]}
          onPress={onCreate}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Crear {getEntityTitle().slice(0, -1)}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{getEntityTitle()}</Text>
      {onSearch && (
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.searchPlaceholder}>Buscar...</Text>
        </View>
      )}
      {onCreate && (
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: accentColor }]}
          onPress={onCreate}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={data.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
  },
  header: {
    backgroundColor: colors.background.primary,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    }),
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchPlaceholder: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  item: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    }),
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  createButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: '#FFFFFF',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
});