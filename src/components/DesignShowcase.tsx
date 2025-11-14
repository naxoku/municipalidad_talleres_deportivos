import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme/colors';
import { sharedStyles } from '../theme/sharedStyles';
import { Button } from '../components/Button';

/**
 * Componente de demostración del nuevo sistema de diseño
 * Muestra todos los colores y componentes disponibles
 */
export const DesignShowcase = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎨 Paleta de Colores</Text>
        
        {/* Color Principal */}
        <View style={styles.colorRow}>
          <View style={[styles.colorBox, { backgroundColor: colors.primary }]} />
          <Text style={styles.colorLabel}>Verde Muni - {colors.primary}</Text>
        </View>
        
        {/* Azules */}
        <View style={styles.colorRow}>
          <View style={[styles.colorBox, { backgroundColor: colors.blue.main }]} />
          <Text style={styles.colorLabel}>Azul Deportes - {colors.blue.main}</Text>
        </View>
        
        <View style={styles.colorRow}>
          <View style={[styles.colorBox, { backgroundColor: colors.blue.light }]} />
          <Text style={styles.colorLabel}>Azul Claro - {colors.blue.light}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔘 Botones</Text>
        
        <Button title="Primary (Verde Muni)" variant="primary" onPress={() => {}} />
        <View style={{ height: spacing.sm }} />
        
        <Button title="Secondary (Azul)" variant="secondary" onPress={() => {}} />
        <View style={{ height: spacing.sm }} />
        
        <Button title="Success" variant="success" onPress={() => {}} />
        <View style={{ height: spacing.sm }} />
        
        <Button title="Danger" variant="danger" onPress={() => {}} />
        <View style={{ height: spacing.sm }} />
        
        <Button title="Outline" variant="outline" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📦 Tarjetas</Text>
        
        {/* Tarjeta con borde azul */}
        <View style={[sharedStyles.card]}>
          <Text style={sharedStyles.cardTitle}>Fútbol Infantil</Text>
          <Text style={sharedStyles.cardDetail}>Profesor: Juan Pérez</Text>
          <Text style={sharedStyles.cardDetail}>Horario: Lunes y Miércoles 15:00</Text>
        </View>

        {/* Tarjeta con borde verde */}
        <View style={[sharedStyles.card, { borderLeftColor: colors.primary }]}>
          <Text style={sharedStyles.cardTitle}>Básquetbol</Text>
          <Text style={sharedStyles.cardDetail}>Profesor: María González</Text>
          <Text style={sharedStyles.cardDetail}>Horario: Martes y Jueves 16:00</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Tipografía</Text>
        
        <Text style={{ fontSize: typography.sizes.xxxl, fontWeight: typography.weights.bold, color: colors.text.primary }}>
          Título Principal (32px)
        </Text>
        <Text style={{ fontSize: typography.sizes.xxl, fontWeight: typography.weights.semibold, color: colors.text.primary }}>
          Título Secundario (24px)
        </Text>
        <Text style={{ fontSize: typography.sizes.lg, color: colors.text.primary }}>
          Título de Tarjeta (18px)
        </Text>
        <Text style={{ fontSize: typography.sizes.md, color: colors.text.secondary }}>
          Texto Normal (16px)
        </Text>
        <Text style={{ fontSize: typography.sizes.sm, color: colors.text.tertiary }}>
          Texto Pequeño (14px)
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📐 Espaciado</Text>
        
        <View style={styles.spacingRow}>
          <View style={[styles.spacingBox, { width: spacing.xs }]} />
          <Text style={styles.spacingLabel}>xs: {spacing.xs}px</Text>
        </View>
        
        <View style={styles.spacingRow}>
          <View style={[styles.spacingBox, { width: spacing.sm }]} />
          <Text style={styles.spacingLabel}>sm: {spacing.sm}px</Text>
        </View>
        
        <View style={styles.spacingRow}>
          <View style={[styles.spacingBox, { width: spacing.md }]} />
          <Text style={styles.spacingLabel}>md: {spacing.md}px</Text>
        </View>
        
        <View style={styles.spacingRow}>
          <View style={[styles.spacingBox, { width: spacing.lg }]} />
          <Text style={styles.spacingLabel}>lg: {spacing.lg}px</Text>
        </View>
        
        <View style={styles.spacingRow}>
          <View style={[styles.spacingBox, { width: spacing.xl }]} />
          <Text style={styles.spacingLabel}>xl: {spacing.xl}px</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔲 Border Radius</Text>
        
        <View style={styles.radiusRow}>
          <View style={[styles.radiusBox, { borderRadius: borderRadius.sm }]} />
          <Text style={styles.radiusLabel}>sm: {borderRadius.sm}px</Text>
        </View>
        
        <View style={styles.radiusRow}>
          <View style={[styles.radiusBox, { borderRadius: borderRadius.md }]} />
          <Text style={styles.radiusLabel}>md: {borderRadius.md}px</Text>
        </View>
        
        <View style={styles.radiusRow}>
          <View style={[styles.radiusBox, { borderRadius: borderRadius.lg }]} />
          <Text style={styles.radiusLabel}>lg: {borderRadius.lg}px</Text>
        </View>
        
        <View style={styles.radiusRow}>
          <View style={[styles.radiusBox, { borderRadius: borderRadius.xl }]} />
          <Text style={styles.radiusLabel}>xl: {borderRadius.xl}px</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
  },
  section: {
    backgroundColor: colors.background.primary,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  colorBox: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  colorLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  spacingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  spacingBox: {
    height: 20,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  spacingLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  radiusBox: {
    width: 50,
    height: 50,
    backgroundColor: colors.blue.main,
    marginRight: spacing.md,
  },
  radiusLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
});
