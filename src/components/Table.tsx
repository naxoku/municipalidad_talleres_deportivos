import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  DimensionValue,
} from 'react-native';
import { colors, borderRadius, spacing, typography } from '../theme/colors';

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  width?: DimensionValue;
  align?: 'left' | 'center' | 'right';
}

export interface TableAction<T> {
  label: string;
  onPress: (item: T) => void;
  color?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  actions?: TableAction<T>[];
  onRowPress?: (item: T) => void;
}

export function Table<T>({ columns, data, keyExtractor, actions, onRowPress }: TableProps<T>) {
  const hasActions = actions && actions.length > 0;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.table}>
        {/* Header */}
        <View style={styles.headerRow}>
          {columns.map((column) => (
            <View
              key={column.key}
              style={[
                styles.headerCell,
                column.width && { width: column.width },
                !column.width && styles.flexCell,
              ]}
            >
              <Text style={[styles.headerText, { textAlign: column.align || 'left' }]}>
                {column.header}
              </Text>
            </View>
          ))}
          {hasActions && (
            <View style={[styles.headerCell, styles.actionsCell]}>
              <Text style={styles.headerText}>Acciones</Text>
            </View>
          )}
        </View>

        {/* Body */}
        {data.map((item, index) => {
          const rowContent = (
            <>
              {columns.map((column) => (
                <View
                  key={column.key}
                  style={[
                    styles.cell,
                    column.width && { width: column.width },
                    !column.width && styles.flexCell,
                  ]}
                >
                  <Text style={[styles.cellText, { textAlign: column.align || 'left' }]}>
                    {column.render(item)}
                  </Text>
                </View>
              ))}
              {hasActions && (
                <View style={[styles.cell, styles.actionsCell]}>
                  <View style={styles.actionButtons}>
                    {actions.map((action, actionIndex) => (
                      <TouchableOpacity
                        key={actionIndex}
                        style={[
                          styles.actionButton,
                          action.color && { backgroundColor: action.color },
                        ]}
                        onPress={() => action.onPress(item)}
                      >
                        <Text style={styles.actionButtonText}>{action.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </>
          );

          if (onRowPress) {
            return (
              <TouchableOpacity
                key={keyExtractor(item)}
                style={[
                  styles.row,
                  index % 2 === 0 && styles.evenRow,
                  styles.clickableRow,
                ]}
                onPress={() => onRowPress(item)}
              >
                {rowContent}
              </TouchableOpacity>
            );
          }

          return (
            <View
              key={keyExtractor(item)}
              style={[styles.row, index % 2 === 0 && styles.evenRow]}
            >
              {rowContent}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  table: {
    minWidth: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.primarySoft,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.primary,
    ...(Platform.OS === 'web' && { cursor: 'default' as any }),
  },
  clickableRow: {
    ...(Platform.OS === 'web' && {
      cursor: 'pointer' as any,
      ':hover': {
        backgroundColor: colors.blue.soft,
      },
    }),
  },
  evenRow: {
    backgroundColor: colors.background.secondary,
  },
  headerCell: {
    padding: spacing.md,
    justifyContent: 'center',
  },
  cell: {
    padding: spacing.md,
    justifyContent: 'center',
  },
  flexCell: {
    flex: 1,
    minWidth: 150,
  },
  actionsCell: {
    width: 200,
    minWidth: 200,
  },
  headerText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  cellText: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.blue.main,
    ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
  },
  actionButtonText: {
    color: colors.text.light,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
});
