/**
 * Tema de colores - Municipalidad de Angol
 * Diseño minimalista con verde principal y azules del logo de Deportes
 */

export const colors = {
    // Color principal de la Municipalidad de Angol
    primary: '#00862d',
    primaryLight: '#00a338',
    primaryDark: '#006622',
    primarySoft: '#e6f4ed',

    // Azules del logo de la Unidad de Deportes
    blue: {
        main: '#1e88e5',
        light: '#42a5f5',
        dark: '#1565c0',
        soft: '#e3f2fd',
    },

    // Colores complementarios minimalistas
    background: {
        primary: '#ffffff',
        secondary: '#f8f9fa',
        tertiary: '#f0f2f5',
    },

    text: {
        primary: '#1a1a1a',
        secondary: '#5f6368',
        tertiary: '#9aa0a6',
        light: '#ffffff',
    },

    // Estados y acciones
    success: '#00862d',
    warning: '#ff9800',
    error: '#e53935',
    info: '#1e88e5',

    // Bordes y divisores
    border: {
        light: '#e8eaed',
        medium: '#dadce0',
        dark: '#c4c7ca',
    },

    // Sombras y overlays
    shadow: 'rgba(0, 0, 0, 0.08)',
    overlay: 'rgba(0, 0, 0, 0.5)',

    // Colores de acento para tarjetas y destacados
    accent: {
        green: '#00862d',
        blue: '#1e88e5',
        orange: '#ff9800',
        purple: '#7c4dff',
    },
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const borderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
};

export const typography = {
    sizes: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
        xxl: 24,
        xxxl: 32,
    },
    weights: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },
};

export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
};
