import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { sharedStyles } from '../theme/sharedStyles';
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
      <View style={[sharedStyles.pickerWrapper, styles.pickerContainerOverride, error && styles.pickerError]}>
        <Picker
          selectedValue={value}
          onValueChange={onValueChange}
          style={[
            styles.picker,
            Platform.OS === 'web'
              ? ({ appearance: 'none', outlineWidth: 0, borderWidth: 0, backgroundColor: 'transparent', height: 44, paddingHorizontal: 12, paddingVertical: 6 } as any)
              : undefined,
          ]}
          dropdownIconColor={colors.text.primary as any}
        >
          <Picker.Item label="Seleccione un valor..." value="" />
          {items.map((item) => (
            <Picker.Item key={String(item.value)} label={item.label} value={item.value} />
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
    // kept for legacy; actual wrapper uses sharedStyles.pickerWrapper
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: borderRadius.md,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  pickerError: {
    borderColor: colors.error,
    borderWidth: 1.5,
  },
  picker: {
    height: Platform.OS === 'ios' ? 180 : 48,
    color: colors.text.primary,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'android' ? 8 : 0,
  },
  pickerContainerOverride: {
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
});
