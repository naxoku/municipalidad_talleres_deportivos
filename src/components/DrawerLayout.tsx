import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Pressable, Platform, Animated, Dimensions, Easing, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlobalSearch from './GlobalSearch';
import { useResponsive } from '../hooks/useResponsive';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';
import { useRouter, usePathname } from 'expo-router';

interface DrawerLayoutProps {
  children: React.ReactNode;
}

export default function DrawerLayout({ children }: DrawerLayoutProps) {
  const { isDesktop } = useResponsive();
  const { userRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const isAdmin = userRole === 'administrador';
  const isProfesor = userRole === 'profesor';
  
  const [open, setOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const windowWidth = Dimensions.get('window').width;
  const drawerWidth = Math.min(280, Math.round(windowWidth * 0.8));

  // Animación del drawer
  useEffect(() => {
    if (open) {
      Animated.timing(slideAnim, { 
        toValue: 1, 
        duration: 280, 
        easing: Easing.out(Easing.cubic), 
        useNativeDriver: true 
      }).start();
    } else {
      Animated.timing(slideAnim, { 
        toValue: 0, 
        duration: 220, 
        easing: Easing.in(Easing.cubic), 
        useNativeDriver: true 
      }).start();
    }
  }, [open, slideAnim]);

  // Cerrar con tecla Escape en web
  useEffect(() => {
    if (Platform.OS !== 'web' || !open) return;
    
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Cerrar drawer al navegar
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Cerrar drawer al cambiar a desktop
  useEffect(() => {
    if (isDesktop) {
      setOpen(false);
    }
  }, [isDesktop]);

  // Links de navegación
  const adminLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: 'home' },
    { href: '/talleres', label: 'Talleres', icon: 'book' },
    { href: '/profesores', label: 'Profesores', icon: 'person' },
    { href: '/alumnos', label: 'Alumnos', icon: 'school' },
    { href: '/horarios', label: 'Horarios', icon: 'time' },
    { href: '/inscripciones', label: 'Inscripciones', icon: 'checkmark-circle' },
    { href: '/asistencia', label: 'Asistencia', icon: 'location' },
    { href: '/reportes', label: 'Reportes', icon: 'bar-chart' },
  ];

  const profesorLinks = [
    { href: '/dashboard', label: 'Inicio', icon: 'home' },
    { href: '/talleres', label: 'Mis Talleres', icon: 'book' },
    { href: '/horarios', label: 'Horarios', icon: 'time' },
    { href: '/alumnos', label: 'Alumnos', icon: 'school' },
    { href: '/asistencia', label: 'Asistencia', icon: 'location' },
  ];

  const links = isAdmin ? adminLinks : isProfesor ? profesorLinks : [{ href: '/talleres', label: 'Talleres', icon: 'book' }];

  const renderLink = (href: string, label: string, icon: string) => {
    const isActive = pathname === href || (pathname === '/' && href === '/dashboard');
    
    return (
      <TouchableOpacity
        key={href}
        style={[styles.link, isActive && styles.linkActive]}
        onPress={() => {
          router.push(href);
          if (!isDesktop) {
            setOpen(false);
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.linkContent}>
          <Ionicons 
            name={icon as any} 
            size={20} 
            color={isActive ? colors.primary : '#fff'} 
          />
          <Text style={[styles.linkText, isActive && styles.linkTextActive]}>
            {label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Drawer Sidebar (Desktop permanente)
  const renderSidebar = () => (
    <View style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <Image 
          source={require('../assets/images/logo/logo_omd.webp')} 
          style={styles.logo}
          resizeMode="contain"
        />
        {/* <Text style={styles.brand}>Talleres{'\n'}Municipales</Text> */}
      </View>
      
      <View style={styles.searchWrap}>
        <GlobalSearch inline />
      </View>
      
      <ScrollView 
        style={styles.links}
        showsVerticalScrollIndicator={false}
      >
        {links.map((l) => renderLink(l.href, l.label, l.icon))}
      </ScrollView>

      <View style={styles.sidebarFooter}>
        <View style={styles.userInfo}>
          <Ionicons name="person-circle" size={32} color="#fff" />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{isAdmin ? 'Administrador' : 'Profesor'}</Text>
            <Text style={styles.userRole}>{userRole}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Topbar (Mobile)
  const renderTopbar = () => (
    <View style={styles.topbar}>
      <TouchableOpacity 
        onPress={() => setOpen(true)} 
        style={styles.menuButton}
        activeOpacity={0.7}
        accessibilityLabel="Abrir menú"
        accessibilityRole="button"
      >
        <Ionicons name="menu" size={24} color={colors.text.primary} />
      </TouchableOpacity>
      
      <Text style={styles.topbarTitle}>Talleres Municipales</Text>
      
      <View style={{ flex: 1 }} />
      
      <GlobalSearch />
    </View>
  );

  // Modal Drawer (Mobile)
  const renderMobileDrawer = () => (
    <Modal 
      visible={open} 
      animationType="none" 
      transparent={true} 
      onRequestClose={() => setOpen(false)}
      statusBarTranslucent
    >
      <Pressable 
        style={styles.modalOverlay} 
        onPress={() => setOpen(false)}
        accessibilityLabel="Cerrar menú"
      >
        <Animated.View 
          style={[
            styles.modalDrawer, 
            { 
              width: drawerWidth,
              transform: [{ 
                translateX: slideAnim.interpolate({ 
                  inputRange: [0, 1], 
                  outputRange: [-drawerWidth, 0] 
                }) 
              }]
            }
          ]}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <Image 
                source={require('../assets/images/logo/logo_omd.webp')} 
                style={styles.modalLogo}
                resizeMode="contain"
              />
              <Text style={styles.modalBrand}>Menú</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setOpen(false)}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.modalLinks}
            showsVerticalScrollIndicator={false}
          >
            {links.map((l) => renderLink(l.href, l.label, l.icon))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <View style={styles.userInfo}>
              <Ionicons name="person-circle" size={32} color={colors.primary} />
              <View style={styles.userDetails}>
                <Text style={[styles.userName, { color: colors.text.primary }]}>
                  {isAdmin ? 'Administrador' : 'Profesor'}
                </Text>
                <Text style={[styles.userRole, { color: colors.text.secondary }]}>
                  {userRole}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );

  return (
    <View style={[styles.container, { flexDirection: isDesktop ? 'row' : 'column' }]}>
      {/* Desktop: Sidebar permanente */}
      {isDesktop && renderSidebar()}
      
      {/* Mobile: Topbar con botón de menú */}
      {!isDesktop && renderTopbar()}
      
      {/* Contenido principal */}
      <View style={styles.content}>
        {children}
      </View>
      
      {/* Mobile: Modal Drawer */}
      {!isDesktop && renderMobileDrawer()}
    </View>
  );
}

const SIDEBAR_WIDTH = 260;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFB' 
  },

  // Sidebar Desktop
  sidebar: { 
    width: SIDEBAR_WIDTH, 
    backgroundColor: '#0F172A',
    height: '100%',
    flexDirection: 'column',
    ...(shadows.lg as any),
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  logo: {
    width: 100,
    height: 100,
  },
  brand: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 16,
    lineHeight: 20,
  },
  searchWrap: { 
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  links: { 
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  link: { 
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: 2,
  },
  linkActive: { 
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  linkContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: spacing.sm,
  },
  linkText: { 
    color: '#fff', 
    fontWeight: '600',
    fontSize: 14,
  },
  linkTextActive: { 
    color: colors.primary,
  },
  sidebarFooter: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },

  // Topbar Mobile
  topbar: { 
    height: 56, 
    backgroundColor: '#fff', 
    alignItems: 'center', 
    flexDirection: 'row', 
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1, 
    borderBottomColor: colors.border.light,
    ...(shadows.sm as any),
  },
  menuButton: { 
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  topbarTitle: { 
    fontSize: 16, 
    fontWeight: '700',
    color: colors.text.primary,
  },

  // Modal Drawer Mobile
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalDrawer: { 
    backgroundColor: '#fff',
    height: '100%',
    flexDirection: 'column',
    ...(shadows.lg as any),
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalBrand: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalLogo: {
    width: 24,
    height: 24,
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalLinks: {
    flex: 1,
    padding: spacing.sm,
  },
  modalFooter: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.secondary,
  },

  // User Info
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  userRole: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'capitalize',
  },

  // Content
  content: { 
    flex: 1, 
    minHeight: '100%',
    backgroundColor: '#F8FAFB',
  },
});