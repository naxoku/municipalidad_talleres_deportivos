import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme/colors';
import { EditFormProps } from '../types/entityTypes';
import { Input } from './Input'; // Assuming Input component exists

export default function EditForm({
  entityType,
  data,
  onSave,
  onCancel,
  loading = false
}: EditFormProps) {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (data) {
      setFormData(data);
    } else {
      // Initialize empty form
      const initial: any = {};
      if (entityType === 'taller') {
        initial.nombre = '';
        initial.descripcion = '';
      } else if (entityType === 'alumno') {
        initial.nombres = '';
        initial.apellidos = '';
        initial.rut = '';
        initial.edad = '';
        initial.telefono = '';
        initial.email = '';
      } else if (entityType === 'profesor') {
        initial.nombre = '';
        initial.especialidad = '';
        initial.email = '';
        initial.telefono = '';
      }
      setFormData(initial);
    }
  }, [data, entityType]);

  const getEntityTitle = () => {
    switch (entityType) {
      case 'taller': return data ? 'Editar Taller' : 'Nuevo Taller';
      case 'alumno': return data ? 'Editar Alumno' : 'Nuevo Alumno';
      case 'profesor': return data ? 'Editar Profesor' : 'Nuevo Profesor';
      default: return 'Editar Entidad';
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

  const handleSave = () => {
    // Basic validation
    if (entityType === 'taller' && !formData.nombre) {
      Alert.alert('Error', 'El nombre del taller es obligatorio');
      return;
    }
    if (entityType === 'alumno' && !formData.nombres) {
      Alert.alert('Error', 'Los nombres del alumno son obligatorios');
      return;
    }
    if (entityType === 'profesor' && (!formData.nombre || !formData.especialidad)) {
      Alert.alert('Error', 'Nombre y especialidad son obligatorios');
      return;
    }

    onSave(formData);
  };

  const renderFields = () => {
    if (entityType === 'taller') {
      return (
        <>
          <Input
            label="Nombre del Taller"
            required
            value={formData.nombre || ''}
            onChangeText={(text) => setFormData({ ...formData, nombre: text })}
            placeholder="Ej: Fútbol Infantil"
          />
          <Input
            label="Descripción"
            value={formData.descripcion || ''}
            onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
            placeholder="Descripción del taller"
            multiline
            numberOfLines={3}
          />
        </>
      );
    } else if (entityType === 'alumno') {
      return (
        <>
          <Input
            label="Nombres"
            required
            value={formData.nombres || ''}
            onChangeText={(text) => setFormData({ ...formData, nombres: text })}
            placeholder="Nombres del alumno"
          />
          <Input
            label="Apellidos"
            value={formData.apellidos || ''}
            onChangeText={(text) => setFormData({ ...formData, apellidos: text })}
            placeholder="Apellidos del alumno"
          />
          <Input
            label="RUT"
            value={formData.rut || ''}
            onChangeText={(text) => setFormData({ ...formData, rut: text })}
            placeholder="RUT del alumno"
          />
          <Input
            label="Edad"
            value={formData.edad?.toString() || ''}
            onChangeText={(text) => setFormData({ ...formData, edad: text.replace(/[^0-9]/g, '') })}
            placeholder="Edad"
            keyboardType="numeric"
          />
          <Input
            label="Teléfono"
            value={formData.telefono || ''}
            onChangeText={(text) => setFormData({ ...formData, telefono: text })}
            placeholder="Teléfono de contacto"
            keyboardType="phone-pad"
          />
          <Input
            label="Email"
            value={formData.email || ''}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="Email del alumno"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </>
      );
    } else if (entityType === 'profesor') {
      return (
        <>
          <Input
            label="Nombre Completo"
            required
            value={formData.nombre || ''}
            onChangeText={(text) => setFormData({ ...formData, nombre: text })}
            placeholder="Nombre del profesor"
          />
          <Input
            label="Especialidad"
            required
            value={formData.especialidad || ''}
            onChangeText={(text) => setFormData({ ...formData, especialidad: text })}
            placeholder="Ej: Educación Física"
          />
          <Input
            label="Email"
            required
            value={formData.email || ''}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="Email del profesor"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Teléfono"
            value={formData.telefono || ''}
            onChangeText={(text) => setFormData({ ...formData, telefono: text })}
            placeholder="Teléfono del profesor"
            keyboardType="phone-pad"
          />
        </>
      );
    }
    return null;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{getEntityTitle()}</Text>
        <Text style={styles.subtitle}>
          {data ? 'Modifica los datos y guarda los cambios' : 'Completa la información y crea la nueva entidad'}
        </Text>
      </View>

      <View style={styles.form}>
        {renderFields()}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton, { backgroundColor: accentColor }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.saveButtonText}>Guardando...</Text>
          ) : (
            <>
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Guardar</Text>
            </>
          )}
        </TouchableOpacity>
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
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    }),
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  form: {
    gap: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
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
  saveButton: {
    // backgroundColor set dynamically
  },
  saveButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: '#FFFFFF',
  },
});