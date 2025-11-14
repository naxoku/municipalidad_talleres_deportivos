import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors, borderRadius, spacing, typography } from '../theme/colors';

interface SelectProps {
  label: string;
  required?: boolean;
  value: string | number;
  onValueChange: (value: string | number) => void;
  items: Array<{ label: string; value: string | number }>;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  required = false,
  value,
  onValueChange,
  items,
  error,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <View style={[styles.pickerContainer, error && styles.pickerError]}>
        <Picker
          selectedValue={value}
          onValueChange={onValueChange}
          style={styles.picker}
        >
          <Picker.Item label="Seleccione..." value="" />
          {items.map((item) => (
            <Picker.Item key={item.value} label={item.label} value={item.value} />
          ))}
        </Picker>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  required: {
    color: colors.error,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.primary,
    overflow: 'hidden',
  },
  pickerError: {
    borderColor: colors.error,
    borderWidth: 1.5,
  },
  picker: {
    height: Platform.OS === 'ios' ? 180 : 50,
    color: colors.text.primary,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
});
