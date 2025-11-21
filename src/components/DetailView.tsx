import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme/colors';
import { DetailViewProps } from '../types/entityTypes';

export default function DetailView({
  entityType,
  data,
  onEdit,
  onDelete,
  onNavigate
}: DetailViewProps) {
  const getEntityTitle = () => {
    switch (entityType) {
      case 'taller': return 'Taller';
      case 'alumno': return 'Alumno';
      case 'profesor': return 'Profesor';
      default: return 'Entidad';
    }
  };

  const getEntityIcon = () => {
    switch (entityType) {
      case 'taller': return 'book-outline';
      case 'alumno': return 'person-outline';
      case 'profesor': return 'school-outline';
      default: return 'information-circle-outline';
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

  const renderBasicInfo = () => {
    const fields = [];
    if (entityType === 'taller') {
      const t = data as any;
      fields.push({ label: 'Nombre', value: t.nombre });
      fields.push({ label: 'Descripción', value: t.descripcion || 'Sin descripción' });
      fields.push({ label: 'Total Alumnos', value: t.total_alumnos?.toString() || '0' });
      fields.push({ label: 'Cupos Máximos', value: t.cupos_maximos?.toString() || 'N/A' });
    } else if (entityType === 'alumno') {
      const a = data as any;
      fields.push({ label: 'Nombres', value: a.nombres });
      fields.push({ label: 'Apellidos', value: a.apellidos || 'N/A' });
      fields.push({ label: 'RUT', value: a.rut || 'N/A' });
      fields.push({ label: 'Edad', value: a.edad?.toString() || 'N/A' });
      fields.push({ label: 'Teléfono', value: a.telefono || 'N/A' });
      fields.push({ label: 'Email', value: a.email || 'N/A' });
    } else if (entityType === 'profesor') {
      const p = data as any;
      fields.push({ label: 'Nombre', value: p.nombre });
      fields.push({ label: 'Especialidad', value: p.especialidad });
      fields.push({ label: 'Email', value: p.email });
      fields.push({ label: 'Teléfono', value: p.telefono || 'N/A' });
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Básica</Text>
        {fields.map((field, index) => (
          <View key={index} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{field.label}:</Text>
            <Text style={styles.infoValue}>{field.value}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderRelatedLists = () => {
    if (entityType === 'taller') {
      const t = data as any;
      return (
        <>
          {t.horarios && t.horarios.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Horarios</Text>
              {t.horarios.map((h: any) => (
                <TouchableOpacity
                  key={h.id}
                  style={styles.relatedItem}
                  onPress={() => onNavigate?.(`/horarios/${h.id}`)}
                >
                  <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
                  <Text style={styles.relatedText}>
                    {h.dia_semana} {h.hora_inicio} - {h.hora_fin}
                    {h.ubicacion && ` (${h.ubicacion})`}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
          {t.alumnos && t.alumnos.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Alumnos Inscritos ({t.alumnos.length})</Text>
              {t.alumnos.slice(0, 5).map((a: any) => (
                <TouchableOpacity
                  key={a.id}
                  style={styles.relatedItem}
                  onPress={() => onNavigate?.(`/alumnos/${a.id}`)}
                >
                  <Ionicons name="person-outline" size={16} color={colors.text.secondary} />
                  <Text style={styles.relatedText}>{a.nombres} {a.apellidos}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
                </TouchableOpacity>
              ))}
              {t.alumnos.length > 5 && (
                <TouchableOpacity
                  style={styles.seeMore}
                  onPress={() => onNavigate?.(`/talleres/${data.id}/alumnos`)}
                >
                  <Text style={styles.seeMoreText}>Ver todos los alumnos</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      );
    } else if (entityType === 'alumno') {
      const a = data as any;
      return (
        <>
          {a.talleres && a.talleres.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Talleres Inscritos</Text>
              {a.talleres.map((t: any) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.relatedItem}
                  onPress={() => onNavigate?.(`/talleres/${t.id}`)}
                >
                  <Ionicons name="book-outline" size={16} color={colors.text.secondary} />
                  <Text style={styles.relatedText}>{t.nombre}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      );
    } else if (entityType === 'profesor') {
      const p = data as any;
      return (
        <>
          {p.talleres && p.talleres.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Talleres Asignados</Text>
              {p.talleres.map((t: any) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.relatedItem}
                  onPress={() => onNavigate?.(`/talleres/${t.id}`)}
                >
                  <Ionicons name="book-outline" size={16} color={colors.text.secondary} />
                  <Text style={styles.relatedText}>{t.nombre}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
          {p.horarios && p.horarios.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Horarios</Text>
              {p.horarios.map((h: any) => (
                <TouchableOpacity
                  key={h.id}
                  style={styles.relatedItem}
                  onPress={() => onNavigate?.(`/horarios/${h.id}`)}
                >
                  <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
                  <Text style={styles.relatedText}>
                    {h.dia_semana} {h.hora_inicio} - {h.hora_fin}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      );
    }
    return null;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={[styles.header, { borderLeftColor: accentColor }]}>
        <View style={[styles.iconContainer, { backgroundColor: accentColor + '20' }]}>
          <Ionicons name={getEntityIcon()} size={24} color={accentColor} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{getEntityTitle()}: {(data as any).nombre || (data as any).nombres}</Text>
          <Text style={styles.subtitle}>ID: {data.id}</Text>
        </View>
      </View>

      {/* Basic Info */}
      {renderBasicInfo()}

      {/* Related Lists */}
      {renderRelatedLists()}

      {/* Actions */}
      <View style={styles.actions}>
        {onEdit && (
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.info }]} onPress={onEdit}>
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
            <Text style={styles.actionText}>Editar</Text>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.error }]} onPress={onDelete}>
            <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
            <Text style={styles.actionText}>Eliminar</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    padding: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    }),
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  section: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    }),
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  infoLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
    minWidth: 100,
  },
  infoValue: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    flex: 1,
  },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.secondary,
    marginBottom: spacing.xs,
  },
  relatedText: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    flex: 1,
    marginLeft: spacing.xs,
  },
  seeMore: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  seeMoreText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  actionText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: '#FFFFFF',
  },
});