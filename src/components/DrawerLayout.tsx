import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Pressable, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../hooks/useResponsive';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';
import { useRouter, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DrawerLayoutProps {
  children: React.ReactNode;
}

export default function DrawerLayout({ children }: DrawerLayoutProps) {
  const { isDesktop } = useResponsive();
  const { userRole, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const isAdmin = userRole === 'administrador';
  
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const sidebarWidthAnim = useRef(new Animated.Value(280)).current;

  // Links de navegación
  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: 'grid-outline' },
    { href: '/talleres', label: 'Talleres', icon: 'basketball-outline' },
    { href: '/horarios', label: 'Horarios', icon: 'time-outline' },
    ...(isAdmin ? [
        { href: '/profesores', label: 'Profesores', icon: 'people-outline' },
        { href: '/alumnos', label: 'Alumnos', icon: 'school-outline' },
        { href: '/inscripciones', label: 'Inscripciones', icon: 'clipboard-outline' },
        { href: '/asistencia', label: 'Asistencia', icon: 'checkmark-done-outline' },
        { href: '/reportes', label: 'Reportes', icon: 'bar-chart-outline' },
    ] : [])
  ];

  useEffect(() => {
    if (open) {
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: -300, duration: 250, useNativeDriver: true }).start();
    }
  }, [open, slideAnim]);

  useEffect(() => {
    const targetWidth = collapsed ? 80 : 280;
    Animated.timing(sidebarWidthAnim, { toValue: targetWidth, duration: 300, useNativeDriver: false }).start();
  }, [collapsed, sidebarWidthAnim]);

  const handleNavigate = (href: string) => {
    router.push(href);
    if (!isDesktop) setOpen(false);
  };

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <View style={styles.sidebarContent}>
      <View style={styles.logoContainer}>
        {!collapsed && (
          <>
            <Image 
                source={require('../assets/images/logo/logo_omd.webp')} 
                style={styles.logo}
                resizeMode="contain"
            />
            <Text style={styles.appName}>Deportes Angol</Text>
          </>
        )}
        <TouchableOpacity onPress={toggleCollapsed} style={styles.collapseButton}>
          <Ionicons 
            name={collapsed ? "chevron-forward" : "chevron-back"} 
            size={20} 
            color={colors.text.secondary} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        {!collapsed && <Text style={styles.menuLabel}>MENU PRINCIPAL</Text>}
        {links.map((link) => {
            const isActive = pathname === link.href;
            return (
                <TouchableOpacity
                    key={link.href}
                    style={[styles.menuItem, isActive && styles.menuItemActive, collapsed && styles.menuItemCollapsed]}
                    onPress={() => handleNavigate(link.href)}
                >
                    <Ionicons 
                        name={link.icon as any} 
                        size={22} 
                        color={isActive ? colors.primary : colors.text.secondary} 
                    />
                    {!collapsed && (
                      <>
                        <Text style={[styles.menuText, isActive && styles.menuTextActive]}>
                            {link.label}
                        </Text>
                        {isActive && <View style={styles.activeIndicator} />}
                      </>
                    )}
                </TouchableOpacity>
            );
        })}
      </ScrollView>

      <View style={[styles.userSection, collapsed && styles.userSectionCollapsed]}>
        {!collapsed && (
          <View style={styles.userInfo}>
              <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{userRole?.charAt(0).toUpperCase()}</Text>
              </View>
              <View>
                  <Text style={styles.userName}>{isAdmin ? 'Administrador' : 'Profesor'}</Text>
                  <Text style={styles.userRole}>Municipalidad</Text>
              </View>
          </View>
        )}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Desktop Sidebar (Permanente) */}
      {isDesktop && (
        <Animated.View style={[styles.desktopSidebar, { width: sidebarWidthAnim }]}>
          <SidebarContent collapsed={collapsed} />
        </Animated.View>
      )}

      {/* Mobile Drawer (Modal) */}
      {!isDesktop && (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
            <Animated.View 
                style={[
                    styles.mobileDrawer, 
                    { transform: [{ translateX: slideAnim }] }
                ]}
            >
                <Pressable style={{ flex: 1 }} onPress={(e) => e.stopPropagation()}>
                     <SidebarContent />
                </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>
      )}

      <View style={styles.mainArea}>
        {/* Mobile Topbar */}
        {!isDesktop && (
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => setOpen(true)} style={styles.iconButton}>
                    <Ionicons name="menu" size={28} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>Deportes Angol</Text>
                <View style={styles.iconButton} /> 
            </View>
        )}

        {/* Main Content Area */}
        <View style={styles.contentWrapper}>
            {children}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background.tertiary,
  },
  // Estilos Sidebar
  desktopSidebar: {
    width: 280,
    backgroundColor: colors.background.primary,
    borderRightWidth: 1,
    borderRightColor: colors.border.light,
    height: '100%',
  },
  mobileDrawer: {
    width: 300,
    height: '100%',
    backgroundColor: colors.background.primary,
    ...shadows.lg,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sidebarContent: {
    flex: 1,
    paddingVertical: spacing.lg,
  },
  logoContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collapseButton: {
    padding: spacing.xs,
  },
  logo: {
    width: 40,
    height: 40,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  menuLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: colors.primarySoft,
  },
  menuItemCollapsed: {
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  menuText: {
    marginLeft: spacing.md,
    fontSize: 15,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  menuTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  activeIndicator: {
    width: 4,
    height: '60%',
    backgroundColor: colors.primary,
    position: 'absolute',
    left: 0,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  
  // Footer Usuario
  userSection: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userSectionCollapsed: {
    justifyContent: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.blue.soft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.blue.main,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  userRole: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  logoutButton: {
    padding: spacing.sm,
  },

  // Main Area
  mainArea: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  topBar: {
    height: 60,
    backgroundColor: colors.background.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  iconButton: {
    padding: 4,
  },
  contentWrapper: {
    flex: 1,
    // Aquí es donde ocurre la magia del centrado en Desktop
    maxWidth: '100%',
  }
});