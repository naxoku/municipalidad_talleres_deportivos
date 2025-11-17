import { StyleSheet, Platform } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from './colors';

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

    // Modales
    modalOverlay: {
        flex: 1,
        backgroundColor: colors.overlay,
        justifyContent: 'flex-end',
    },
    webModalOverlay: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    modalSafeArea: {
        maxHeight: '90%',
    },
    webModalSafeArea: {
        maxHeight: undefined,
    },
    modalContent: {
        backgroundColor: colors.background.primary,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        maxHeight: '100%',
        ...shadows.lg,
    },
    webModalContent: {
        borderRadius: borderRadius.lg,
        width: 600,
        maxWidth: '90%',
        maxHeight: '90%',
        ...shadows.lg,
    },
    modalHeader: {
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    modalTitle: {
        fontSize: typography.sizes.xl,
        fontWeight: typography.weights.semibold,
        color: colors.text.primary,
        textAlign: 'center',
    },
    modalBody: {
        padding: spacing.lg,
        maxHeight: Platform.OS === 'web' ? 400 : undefined,
    },
    modalFooter: {
        flexDirection: 'row',
        padding: spacing.lg,
        gap: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
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
