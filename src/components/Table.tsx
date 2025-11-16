import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Platform,
  DimensionValue,
} from 'react-native';
import { colors, borderRadius, spacing, typography } from '../theme/colors';
import SearchBar from './SearchBar';
import { Ionicons } from '@expo/vector-icons';

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  width?: DimensionValue;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

export interface TableAction<T> {
  label: string;
  onPress: (item: T) => void;
  color?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  actions?: TableAction<T>[];
  onRowPress?: (item: T) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  externalSearchTerm?: string;
  onExternalSearchTerm?: (text: string) => void;
  searchableFields?: string[];
  emptyMessage?: string;
  loading?: boolean;
  stickyHeader?: boolean;
  maxHeight?: number;
  pinScrollHintToWindow?: boolean;
}

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

// Tooltip Component for truncated text
const Tooltip: React.FC<{ text: string; visible: boolean; x: number; y: number }> = ({ text, visible, x, y }) => {
  if (!visible || Platform.OS !== 'web') return null;

  return (
    <View style={[styles.tooltip, { position: 'fixed' as any, left: x, top: y }]}>
      <Text style={styles.tooltipText}>{text}</Text>
    </View>
  );
};

// Cell with truncation indicator and tooltip
const TableCell: React.FC<{
  content: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: DimensionValue;
  isLast?: boolean;
  clickable?: boolean;
  isFirst?: boolean;
}> = ({ content, align = 'left', width, isLast, clickable, isFirst }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isTruncated, setIsTruncated] = useState(false);
  const cellRef = useRef<any>(null);
  const contentString = typeof content === 'string' || typeof content === 'number' ? String(content) : '';

  const handleTextLayout = (e: any) => {
    if (Platform.OS === 'web' && contentString) {
      const lines = e.nativeEvent?.lines;
      if (lines && lines.length > 0) {
        setIsTruncated(lines.length >= 2 || contentString.length > 50);
      }
    }
  };

  const handleMouseEnter = () => {
    if (Platform.OS === 'web' && isTruncated && contentString && cellRef.current) {
      try {
        const rect = cellRef.current.getBoundingClientRect?.();
        if (rect) {
          setTooltipPos({
            x: rect.left,
            y: rect.bottom + 8,
          });
          setShowTooltip(true);
        }
      } catch (e) {
        // Ignore
      }
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const cellProps = Platform.OS === 'web' ? {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  } : {};

  return (
    <>
      <View
        ref={cellRef}
        style={[
          styles.cell,
          isFirst && styles.firstColumnCell,
          width && { width },
          !width && styles.flexCell,
          isLast && styles.lastColumnCell,
        ]}
        {...cellProps}
      >
        <Text
          style={[
            styles.cellText,
            { textAlign: align },
            clickable && styles.clickableCellText,
          ]}
          numberOfLines={2}
          ellipsizeMode="tail"
          onTextLayout={handleTextLayout}
        >
          {content}
        </Text>
        {isTruncated && Platform.OS === 'web' && (
          <View style={styles.truncateIndicator}>
            <Ionicons name="information-circle" size={14} color={colors.blue.main} />
          </View>
        )}
      </View>
      {Platform.OS === 'web' && (
        <Tooltip text={contentString} visible={showTooltip} x={tooltipPos.x} y={tooltipPos.y} />
      )}
    </>
  );
};

export function Table<T>({ 
  columns, 
  data, 
  keyExtractor, 
  actions, 
  onRowPress,
  searchable = false,
  searchPlaceholder = "Buscar...",
  externalSearchTerm,
  onExternalSearchTerm,
  searchableFields,
  emptyMessage = "No hay datos disponibles",
  loading = false,
  stickyHeader = true,
  maxHeight,
  pinScrollHintToWindow = false,
}: TableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const containerRef = useRef<any>(null);
  
  const controlled = typeof externalSearchTerm !== 'undefined';
  const searchValue = controlled ? externalSearchTerm! : searchTerm;

  const normalize = (s: string) =>
    s
      ? s
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toLowerCase()
      : '';

  const filteredData = useMemo(() => {
    if (!searchable || !searchValue || !searchValue.trim()) {
      return data;
    }

    const needle = normalize(searchValue.trim());

    return data.filter((item) => {
      return columns
        .filter((column) => !searchableFields || searchableFields.includes(column.key))
        .some((column) => {
          const cellValue = column.render(item);
          if (typeof cellValue === 'string' || typeof cellValue === 'number') {
            const hay = normalize(String(cellValue));
            return hay.includes(needle);
          }
          return false;
        });
    });
  }, [data, searchValue, columns, searchable, searchableFields]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const column = columns.find(col => col.key === sortConfig.key);
      if (!column) return 0;

      const aVal = column.render(a);
      const bVal = column.render(b);

      const aStr = String(aVal || '');
      const bStr = String(bVal || '');

      if (sortConfig.direction === 'asc') {
        return aStr.localeCompare(bStr, 'es', { numeric: true });
      } else {
        return bStr.localeCompare(aStr, 'es', { numeric: true });
      }
    });

    return sorted;
  }, [filteredData, sortConfig, columns]);

  const handleSort = (columnKey: string) => {
    setSortConfig(current => {
      if (current?.key === columnKey) {
        if (current.direction === 'asc') {
          return { key: columnKey, direction: 'desc' };
        } else {
          return null;
        }
      }
      return { key: columnKey, direction: 'asc' };
    });
  };

  const hasActions = actions && actions.length > 0;

  const renderSortIcon = (columnKey: string) => {
    if (sortConfig?.key !== columnKey) {
      return <Ionicons name="swap-vertical" size={16} color={colors.text.light} style={styles.sortIcon} />;
    }
    return (
      <Ionicons 
        name={sortConfig.direction === 'asc' ? 'arrow-up' : 'arrow-down'} 
        size={16} 
        color={colors.text.light}
        style={styles.sortIcon}
      />
    );
  };

  // Action Menu Component
  const ActionMenu: React.FC<{ item: T; itemKey: string }> = ({ item, itemKey }) => {
    const isOpen = actionMenuOpen === itemKey;

    return (
      <View style={styles.actionMenuContainer}>
        <TouchableOpacity
          style={styles.actionMenuButton}
          onPress={() => setActionMenuOpen(isOpen ? null : itemKey)}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
        {isOpen && (
          <View style={styles.actionMenuDropdown}>
            {actions?.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.actionMenuItem,
                  index === actions.length - 1 && styles.lastActionMenuItem
                ]}
                onPress={() => {
                  action.onPress(item);
                  setActionMenuOpen(null);
                }}
                activeOpacity={0.7}
              >
                {action.icon && (
                  <Ionicons 
                    name={action.icon} 
                    size={18} 
                    color={action.color || colors.text.primary}
                    style={styles.actionMenuIcon}
                  />
                )}
                <Text style={[
                  styles.actionMenuText,
                  action.color && { color: action.color }
                ]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View
        ref={containerRef}
        style={[styles.tableWrapper, maxHeight ? { maxHeight } : styles.defaultMaxHeight]}
      >
        <ScrollView
          showsVerticalScrollIndicator={true}
          persistentScrollbar={true}
          style={styles.verticalScroll}
        >
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={true}
            persistentScrollbar={true}
            contentContainerStyle={styles.scrollContent}
            style={styles.tableScrollView}
          >
            <View style={styles.table}>
              {/* Header */}
              <View style={[styles.headerRow, stickyHeader && Platform.OS === 'web' && styles.stickyHeader]}>
                {columns.map((column, index) => (
                  <TouchableOpacity
                    key={column.key}
                    style={[
                      styles.headerCell,
                      index === 0 && styles.firstHeaderCell,
                      column.width && { width: column.width },
                      !column.width && styles.flexCell,
                      index === columns.length - 1 && !hasActions && styles.lastHeaderCell,
                    ]}
                    onPress={() => column.sortable !== false && handleSort(column.key)}
                    disabled={column.sortable === false}
                    activeOpacity={column.sortable === false ? 1 : 0.7}
                  >
                    <View style={styles.headerContent}>
                      <Text style={[styles.headerText, { textAlign: column.align || 'left' }]}>
                        {column.header}
                      </Text>
                      {column.sortable !== false && renderSortIcon(column.key)}
                    </View>
                  </TouchableOpacity>
                ))}
                {hasActions && (
                  <View style={[styles.headerCell, styles.actionsHeaderCell, styles.lastHeaderCell]}>
                    <Text style={styles.headerText}>Acciones</Text>
                  </View>
                )}
              </View>

              {/* Body */}
              {loading && (
                <View style={styles.loadingContainer}>
                  <Ionicons name="hourglass-outline" size={48} color={colors.primary} />
                  <Text style={styles.loadingText}>Cargando...</Text>
                </View>
              )}

              {!loading && sortedData.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="file-tray-outline" size={64} color={colors.text.tertiary} />
                  <Text style={styles.emptyText}>{emptyMessage}</Text>
                </View>
              )}

              {!loading && sortedData.map((item, index) => {
                const rowKey = keyExtractor(item);
                const isHovered = hoveredRow === rowKey;
                
                const rowContent = (
                  <>
                      {columns.map((column, colIndex) => (
                        <TableCell
                          key={column.key}
                          content={column.render(item)}
                          align={column.align}
                          width={column.width}
                          isLast={colIndex === columns.length - 1 && !hasActions}
                          isFirst={colIndex === 0}
                          clickable={!!onRowPress}
                        />
                      ))}
                    {hasActions && (
                      <View style={[styles.cell, styles.actionsCell, styles.lastCell]}>
                        <ActionMenu item={item} itemKey={rowKey} />
                      </View>
                    )}
                  </>
                );

                if (onRowPress) {
                  return (
                    <Pressable
                      key={rowKey}
                      onPress={() => onRowPress(item)}
                      onHoverIn={() => Platform.OS === 'web' && setHoveredRow(rowKey)}
                      onHoverOut={() => Platform.OS === 'web' && setHoveredRow(null)}
                      style={({ pressed }) => [
                        styles.row,
                        index % 2 === 0 && styles.evenRow,
                        styles.clickableRow,
                        isHovered && styles.hoveredRow,
                        pressed && styles.pressedRow,
                      ]}
                    >
                      {rowContent}
                    </Pressable>
                  );
                }

                return (
                  <View
                    key={rowKey}
                    style={[
                      styles.row, 
                      index % 2 === 0 && styles.evenRow,
                    ]}
                  >
                    {rowContent}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  tableWrapper: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.primary,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  defaultMaxHeight: {
    ...Platform.select({
      web: {
        maxHeight: 'calc(100vh - 240px)' as any,
      },
      default: {
        maxHeight: 600,
      },
    }),
  },
  scrollContent: {
    flexGrow: 0,
  },
  tableScrollView: {
    flexGrow: 0,
  },
  verticalScroll: {
    height: '100%',
  },
  table: {
    minWidth: '100%',
    backgroundColor: colors.background.primary,
  },
  stickyHeader: {
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        top: 0,
        zIndex: 100,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    borderBottomWidth: 2,
    borderBottomColor: '#111827',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  row: {
    flexDirection: 'row',
    // create vertical spacing between rows to emulate table border-spacing
    marginVertical: 6,
    alignItems: 'stretch',
    minHeight: 0,
    ...Platform.select({
      web: {
        transition: 'all 0.15s ease-in-out',
      },
    }),
  },
  clickableRow: {
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  hoveredRow: {
    // slight lift and shadow on hover to emphasize pill
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        boxShadow: '0 6px 18px rgba(15, 23, 42, 0.08)',
        transform: 'translateY(-2px)',
      },
    }),
  },
  pressedRow: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    ...Platform.select({
      web: {
        transform: 'translateY(0)',
      },
    }),
  },
  evenRow: {},
  headerCell: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.15)',
    minHeight: 52,
  },
  lastHeaderCell: {
    borderRightWidth: 0,
  },
  firstHeaderCell: {
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        left: 0,
        top: 0,
        zIndex: 110,
        backgroundColor: colors.primary,
        borderRightWidth: 1,
        borderRightColor: 'rgba(255, 255, 255, 0.15)',
      },
      default: {},
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sortIcon: {
    marginLeft: spacing.xs,
  },
  cell: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    position: 'relative',
    // uniform pill background for each cell
    backgroundColor: '#f5f6f8',
  },
  lastCell: {
    borderRightWidth: 0,
  },
  lastColumnCell: {
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    backgroundColor: '#f5f6f8',
    alignItems: 'flex-end',
  },
  firstColumnCell: {
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        left: 0,
        zIndex: 100,
        backgroundColor: '#f5f6f8',
        boxShadow: '2px 0 6px rgba(0,0,0,0.04)',
      },
      default: {},
    }),
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  flexCell: {
    flex: 1,
    minWidth: 150,
  },
  actionsCell: {
    width: 80,
    minWidth: 80,
    alignItems: 'center',
  },
  actionsHeaderCell: {
    width: 80,
    minWidth: 80,
    alignItems: 'center',
  },
  headerText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.light,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cellText: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    lineHeight: 22,
    fontWeight: typography.weights.regular,
  },
  clickableCellText: {
    ...Platform.select({
      web: {
        userSelect: 'none' as any,
      },
    }),
  },
  truncateIndicator: {
    position: 'absolute',
    right: spacing.sm,
    top: '50%',
    transform: [{ translateY: -7 }],
  },
  tooltip: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    maxWidth: 300,
    zIndex: 9999,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  tooltipText: {
    color: colors.text.light,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
  },
  actionMenuContainer: {
    position: 'relative',
  },
  actionMenuButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ':hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
        },
      },
    }),
  },
  actionMenuDropdown: {
    position: 'absolute',
    right: 0,
    top: 40,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    minWidth: 160,
    zIndex: 1000,
    ...Platform.select({
      web: {
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
      },
    }),
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
        ':hover': {
          backgroundColor: colors.blue.soft,
        },
      },
    }),
  },
  lastActionMenuItem: {
    borderBottomWidth: 0,
  },
  actionMenuIcon: {
    marginRight: spacing.sm,
  },
  actionMenuText: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.blue.main,
    minHeight: 32,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ':hover': {
          opacity: 0.8,
          transform: 'translateY(-1px)',
        },
        ':active': {
          transform: 'translateY(0)',
        },
      },
    }),
    ...Platform.select({
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
      },
    }),
  },
  actionIcon: {
    marginRight: spacing.xs,
  },
  actionButtonText: {
    color: colors.text.light,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  loadingContainer: {
    padding: spacing.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  loadingText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    marginTop: spacing.lg,
    fontWeight: typography.weights.medium,
  },
  emptyContainer: {
    padding: spacing.xl * 3,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  emptyText: {
    fontSize: typography.sizes.lg,
    color: colors.text.secondary,
    marginTop: spacing.lg,
    textAlign: 'center',
    fontWeight: typography.weights.medium,
  },
});
