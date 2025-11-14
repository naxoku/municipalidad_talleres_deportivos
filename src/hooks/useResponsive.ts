import { useState, useEffect } from 'react';
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
}

const BREAKPOINTS = {
    tablet: 768,
    desktop: 1024,
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

    return {
        deviceType,
        platformType,
        isMobile: deviceType === 'mobile',
        isTablet: deviceType === 'tablet',
        isDesktop: deviceType === 'desktop',
        isWeb: platformType === 'web',
        isNative: platformType === 'native',
        width,
        height,
    };
};
