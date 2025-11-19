import { StyleSheet, Platform } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from './colors';

// Altura estándar para botones compactos (quick actions, botones de header)
export const BUTTON_HEIGHT = 36;

/**
 *  Estilos compartidos para todas las pantallas
 **/
export const sharedStyles = StyleSheet.create({
    // Contenedores
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

    // Tarjetas (cards)
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

    // Estilos de modales 
    modalOverlay: { // Para móvil
        flex: 1,
        backgroundColor: colors.overlay,
        justifyContent: 'flex-end',
    },
    webModalOverlay: { // Para web
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        backgroundColor: colors.overlay,
    },
    modalSafeArea: {
        maxHeight: '100%',
    },
    webModalSafeArea: {
        maxHeight: undefined,
    },
    modalContent: {
        backgroundColor: colors.background.primary,
        borderTopLeftRadius: borderRadius.lg,
        borderTopRightRadius: borderRadius.lg,
        maxHeight: '100%',
        borderWidth: 1,
        borderColor: colors.border.light,
        overflow: 'hidden',
    },
    webModalContent: {
        borderRadius: borderRadius.lg,
        width: 600,
        maxWidth: '90%',
        maxHeight: '100%',
        borderWidth: 1,
        borderColor: colors.border.light,
        ...(Platform.OS === 'web' ? {
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
        } : {
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 8,
        }),
    },
    modalHeader: {
        padding: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
    },
    modalTitle: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.semibold,
        color: colors.text.primary,
        textAlign: 'center',
        letterSpacing: -0.3,
    },
    modalBody: {
        padding: spacing.lg,
    },
    modalFooter: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
        backgroundColor: colors.background.secondary,
        padding: 0,
        gap: 0,
        minHeight: 56,
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
        overflow: 'hidden',
    },
    pickerScroll: {
        maxHeight: 200,
    },
    pickerItem: {
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
        ...(Platform.OS === 'web' && {
            cursor: 'pointer' as any,
            transition: 'background-color 0.15s ease' as any,
        }),
    },
    pickerItemSelected: {
        backgroundColor: colors.blue.soft,
        borderRadius: borderRadius.sm,
        marginHorizontal: spacing.sm,
        marginVertical: spacing.xs,
    },
    pickerItemText: {
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.medium,
        color: colors.text.primary,
    },
});

// Colores  de tarjetas
export const cardAccentColors = [
    colors.blue.main,
    colors.primary,
    colors.accent.purple,
    colors.accent.orange,
];

// Obtiene un color de acento para tarjetas basado en el índice
export const getCardAccentColor = (index: number): string => {
    return cardAccentColors[index % cardAccentColors.length];
};
