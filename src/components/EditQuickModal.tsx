import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import ElegantModal from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { spacing } from '../theme/colors';

interface Field {
  key: string;
  label: string;
  type: 'text' | 'select' | 'textarea' | 'number';
  value: string | number;
  options?: { label: string; value: string | number }[];
  disabled?: boolean;
  required?: boolean;
}

interface EditQuickModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  fields: Field[];
  onSave: (data: Record<string, string | number>) => Promise<void>;
  loading?: boolean;
}

export const EditQuickModal: React.FC<EditQuickModalProps> = ({
  visible,
  onClose,
  title,
  fields,
  onSave,
  loading = false,
}) => {
  const [formData, setFormData] = useState<Record<string, string | number>>(() =>
    fields.reduce((acc, field) => ({ ...acc, [field.key]: field.value }), {})
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    // Validación simple
    const newErrors: string[] = [];
    fields.forEach((field) => {
      if (field.required && !formData[field.key]) {
        newErrors.push(`${field.label} es requerido`);
      }
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    setErrors([]);
    try {
      await onSave(formData);
      onClose();
    } catch {
      setErrors(['Error al guardar los cambios. Intenta nuevamente.']);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ElegantModal
      visible={visible}
      onClose={onClose}
      title={title}
      maxWidth={500}
      floatingAlerts={errors}
      footer={
        <View style={styles.footer}>
          <Button
            title="Cancelar"
            variant="outline"
            onPress={onClose}
            disabled={isSaving}
            style={styles.button}
          />
          <Button
            title="Guardar"
            variant="primary"
            onPress={handleSave}
            loading={isSaving || loading}
            disabled={isSaving || loading}
            style={styles.button}
          />
        </View>
      }
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.formContainer}>
          {fields.map((field) => {
            if (field.type === 'select' && field.options) {
              return (
                <Select
                  key={field.key}
                  label={field.label}
                  value={String(formData[field.key])}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, [field.key]: value }))
                  }
                  items={field.options}
                />
              );
            }

            return (
              <Input
                key={field.key}
                label={field.label}
                value={String(formData[field.key])}
                onChangeText={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    [field.key]: field.type === 'number' ? Number(value) : value,
                  }))
                }
                multiline={field.type === 'textarea'}
                numberOfLines={field.type === 'textarea' ? 4 : 1}
                keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                editable={!field.disabled}
              />
            );
          })}
        </View>
      </ScrollView>
    </ElegantModal>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    maxHeight: 500,
  },
  formContainer: {
    gap: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'flex-end',
  },
  button: {
    flex: 1,
  },
});
