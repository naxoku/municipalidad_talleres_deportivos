import { StyleSheet, Platform } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from './colors';

// Altura estándar para botones compactos (quick actions, botones de header)
export const BUTTON_HEIGHT = 36;

/**
 * Estilos compartidos para todas las pantallas
 * Diseño minimalista con verde principal y azules de Deportes
 */
export const sharedStyles = StyleSheet.create({
    // Contenedores principales
    container: {
        flex: 1,
        backgroundColor: colors.background.tertiary,
    },
    contentWrapper: {
        flex: 1,
    },
    webContentWrapper: {
        maxWidth: 1400,
        width: '100%',
        alignSelf: 'center',
        backgroundColor: colors.background.primary,
        minHeight: Platform.OS === 'web' ? ('100vh' as any) : undefined,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xl,
    },
    tableContainer: {
        flex: 1,
        backgroundColor: colors.background.primary,
        padding: spacing.md,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
        ...(Platform.OS === 'web' && { position: 'sticky' as any, top: 0, zIndex: 2000 }),
    },
    headerTitle: {
        fontSize: typography.sizes.xxl,
        fontWeight: typography.weights.semibold,
        color: colors.text.primary,
    },
    addButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    addButtonText: {
        color: colors.text.light,
        fontWeight: typography.weights.semibold,
        fontSize: typography.sizes.sm,
    },

    // Loaders
    loader: {
        marginTop: spacing.lg,
    },

    // Listas
    listContent: {
        padding: spacing.md,
    },

    // Tarjetas (Cards)
    card: {
        backgroundColor: colors.background.primary,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderLeftWidth: 3,
        borderLeftColor: colors.blue.main,
        ...shadows.md,
    },
    cardContent: {
        marginBottom: spacing.md,
    },
    cardTitle: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.semibold,
        color: colors.text.primary,
        marginBottom: spacing.sm,
    },
    cardDetail: {
        fontSize: typography.sizes.sm,
        color: colors.text.secondary,
        marginBottom: spacing.xs,
    },
    cardActions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    actionButton: {
        flex: 1,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        minHeight: BUTTON_HEIGHT,
    },
    editButton: {
        backgroundColor: colors.blue.main,
    },
    deleteButton: {
        backgroundColor: colors.error,
    },
    actionButtonText: {
        color: colors.text.light,
        fontWeight: typography.weights.semibold,
        fontSize: typography.sizes.sm,
    },

    // Modales - Estilo minimalista mejorado (inspirado en Expo Router web modals)
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // Overlay más sutil (40% en lugar de 50%)
        justifyContent: 'flex-end',
    },
    webModalOverlay: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // Consistente con mobile
    },
    modalSafeArea: {
        maxHeight: '90%',
    },
    webModalSafeArea: {
        maxHeight: undefined,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 12, // Aumentado de 8 a 12 para mejor apariencia
        borderTopRightRadius: 12,
        maxHeight: '100%',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
    },
    webModalContent: {
        borderRadius: 12, // Aumentado de 8 a 12
        width: 600,
        maxWidth: '90%',
        maxHeight: '90%', // Mantener compatible con React Native types
        borderWidth: 1,
        borderColor: '#E5E7EB',
        // Sombras mejoradas (inspiradas en drop-shadow de Expo)
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
    },
    modalHeader: {
        padding: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56, // Altura mínima para mejor toque en móvil
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'center',
        letterSpacing: -0.3, // Tipografía mejorada
    },
    modalBody: {
        padding: 16,
    },
    modalFooter: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        backgroundColor: '#FAFBFC',
        padding: 0,
        gap: 0,
        minHeight: 56, // Altura mínima consistente con header
    },
    modalButton: {
        flex: 1,
    },

    // Inputs personalizados (para pickers, etc.)
    inputContainer: {
        marginBottom: spacing.md,
    },
    label: {
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.medium,
        color: colors.text.primary,
        marginBottom: spacing.sm,
    },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: colors.border.medium,
        borderRadius: borderRadius.md,
        backgroundColor: colors.background.primary,
        maxHeight: 200,
    },
    pickerScroll: {
        maxHeight: 200,
    },
    pickerItem: {
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    pickerItemSelected: {
        backgroundColor: colors.blue.soft,
    },
    pickerItemText: {
        fontSize: typography.sizes.sm,
        color: colors.text.primary,
    },
});

/**
 * Colores alternativos para variaciones de tarjetas
 */
export const cardAccentColors = [
    colors.blue.main,
    colors.primary,
    colors.accent.purple,
    colors.accent.orange,
];

/**
 * Obtiene un color de acento para tarjetas basado en el índice
 */
export const getCardAccentColor = (index: number): string => {
    return cardAccentColors[index % cardAccentColors.length];
};
