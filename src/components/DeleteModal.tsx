import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme/colors';
import { DeleteModalProps } from '../types/entityTypes';

export default function DeleteModal({
  visible,
  entityType,
  entityName,
  onConfirm,
  onCancel,
  loading = false
}: DeleteModalProps) {
  const getEntityTitle = () => {
    switch (entityType) {
      case 'taller': return 'Eliminar Taller';
      case 'alumno': return 'Eliminar Alumno';
      case 'profesor': return 'Eliminar Profesor';
      default: return 'Eliminar Entidad';
    }
  };

  const getEntityDescription = () => {
    switch (entityType) {
      case 'taller':
        return `¿Estás seguro de eliminar el taller "${entityName}"?\n\n⚠️ Esta acción eliminará:\n• Todos los horarios asociados\n• Las inscripciones de alumnos\n• El historial de asistencia\n\nEsta acción no se puede deshacer.`;
      case 'alumno':
        return `¿Estás seguro de eliminar al alumno "${entityName}"?\n\n⚠️ Esta acción eliminará:\n• Todas las inscripciones del alumno\n• El historial de asistencia\n\nEsta acción no se puede deshacer.`;
      case 'profesor':
        return `¿Estás seguro de eliminar al profesor "${entityName}"?\n\n⚠️ Esta acción eliminará:\n• La asignación de horarios\n• El acceso al sistema\n\nEsta acción no se puede deshacer.`;
      default:
        return `¿Estás seguro de eliminar "${entityName}"?\n\nEsta acción no se puede deshacer.`;
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={[styles.header, { backgroundColor: accentColor }]}>
            <Ionicons name="warning" size={24} color="#FFFFFF" />
            <Text style={styles.title}>{getEntityTitle()}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onCancel}
              disabled={loading}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <Text style={styles.description}>{getEntityDescription()}</Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.deleteButtonText}>Eliminando...</Text>
              ) : (
                <>
                  <Ionicons name="trash" size={18} color="#FFFFFF" />
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    flex: 1,
  },
  closeButton: {
    padding: spacing.xs,
  },
  body: {
    padding: spacing.lg,
  },
  description: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  cancelButton: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cancelButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  deleteButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: '#FFFFFF',
  },
});