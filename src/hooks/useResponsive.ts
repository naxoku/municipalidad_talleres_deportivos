import { useWindowDimensions, Platform } from 'react-native';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type PlatformType = 'web' | 'native';

interface ResponsiveInfo {
    deviceType: DeviceType;
    platformType: PlatformType;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isWeb: boolean;
    isNative: boolean;
    width: number;
    height: number;
    // Valores dinámicos de UI
    contentMaxWidth: number | string;
    numColumns: number;
    drawerType: 'permanent' | 'front';
    modalWidth: number | string;
}

const BREAKPOINTS = {
    tablet: 768,
    desktop: 1024,
    wide: 1280,
};

export const useResponsive = (): ResponsiveInfo => {
    const { width, height } = useWindowDimensions();
    const platformType: PlatformType = Platform.OS === 'web' ? 'web' : 'native';

    const getDeviceType = (): DeviceType => {
        if (width >= BREAKPOINTS.desktop) return 'desktop';
        if (width >= BREAKPOINTS.tablet) return 'tablet';
        return 'mobile';
    };

    const deviceType = getDeviceType();
    const isDesktop = deviceType === 'desktop';
    const isTablet = deviceType === 'tablet';
    const isMobile = deviceType === 'mobile';

    // Cálculos automáticos para grillas
    let numColumns = 1;
    if (width >= BREAKPOINTS.wide) numColumns = 4;
    else if (width >= BREAKPOINTS.desktop) numColumns = 3;
    else if (width >= BREAKPOINTS.tablet) numColumns = 2;

    return {
        deviceType,
        platformType,
        isMobile,
        isTablet,
        isDesktop,
        isWeb: platformType === 'web',
        isNative: platformType === 'native',
        width,
        height,
        // Helpers de UI
        contentMaxWidth: isDesktop ? 1200 : '100%',
        numColumns,
        drawerType: isDesktop ? 'permanent' : 'front',
        modalWidth: isDesktop ? 600 : '90%',
    };
};