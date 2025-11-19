import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Pressable, Platform, Animated, Dimensions, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlobalSearch from './GlobalSearch';
import { useResponsive } from '../hooks/useResponsive';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import { useRouter } from 'expo-router';

export default function DrawerLayout({ children }: { children: React.ReactNode }) {
  const { isWeb, isDesktop } = useResponsive();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'administrador';
  const isProfesor = userRole === 'profesor';
  const [open, setOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const windowWidth = Dimensions.get('window').width;
  const drawerWidth = Math.min(360, Math.round(windowWidth * 0.8));
  const router = useRouter();

  const makeLink = (href: string, label: string, icon?: string) => {
    return (
      <TouchableOpacity
        key={href}
        style={styles.link}
        onPress={() => {
          router.push(href);
          if (!isDesktop) {
            Animated.timing(slideAnim, { toValue: 0, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => setOpen(false));
          }
        }}
      >
        <View style={styles.linkContent}>
          {icon && <Ionicons name={icon as any} size={18} color={'#fff'} />}
          <Text style={styles.linkText}>{label}</Text>
        </View>
      </TouchableOpacity>
    );
  };

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
    { href: '/talleres', label: 'Mis Talleres', icon: 'book' },
    { href: '/horarios', label: 'Horarios', icon: 'time' },
    { href: '/alumnos', label: 'Alumnos', icon: 'school' },
    { href: '/asistencia', label: 'Asistencia', icon: 'location' },
  ];

  const links = isAdmin ? adminLinks : isProfesor ? profesorLinks : [{ href: '/talleres', label: 'Talleres', icon: 'book' }];

  useEffect(() => {
    if (open) {
      Animated.timing(slideAnim, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start();
    }
  }, [open]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        Animated.timing(slideAnim, { toValue: 0, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => setOpen(false));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <View style={styles.container}>
      {isDesktop ? (
        <View style={styles.sidebar}>
          <Text style={styles.brand}>Talleres municipales</Text>
          <View style={styles.searchWrap}>
            <GlobalSearch inline />
          </View>
          <ScrollView style={styles.links}>{links.map((l) => makeLink(l.href, l.label, l.icon))}</ScrollView>
        </View>
      ) : (
        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => setOpen(true)} style={styles.menuButton}>
            <Ionicons name="menu" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>Talleres municipales</Text>
          <View style={{ flex: 1 }} />
          <GlobalSearch />
        </View>
      )}

      <View style={styles.content}>{children}</View>

      <Modal visible={open} animationType="none" transparent={true} onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => { Animated.timing(slideAnim, { toValue: 0, duration: 230, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => setOpen(false)); }} accessibilityLabel="Cerrar menú">
          <Animated.View style={[ styles.modalDrawer, { width: drawerWidth, transform: [{ translateX: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [ -drawerWidth, 0 ] }) }] } ]} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.brand}>Menú</Text>
              <TouchableOpacity onPress={() => { Animated.timing(slideAnim, { toValue: 0, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => setOpen(false)); }}>
                <Ionicons name="close" size={22} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ marginTop: 12 }}>{links.map((l) => makeLink(l.href, l.label, l.icon))}</ScrollView>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#F8FAFB' },
  sidebar: { width: 250, backgroundColor: '#0F172A', paddingTop: 24, paddingHorizontal: 12, height: '100%' },
  brand: { color: '#fff', fontWeight: '700', fontSize: 18, marginBottom: 12 },
  searchWrap: { marginBottom: 12 },
  links: { marginTop: 8 },
  link: { paddingVertical: 10, paddingHorizontal: 10, borderRadius: 8, marginVertical: 4 },
  linkContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  linkText: { color: '#fff', marginLeft: 8, fontWeight: '600' },
  content: { flex: 1, minHeight: '100%' },
  topbar: { height: 64, backgroundColor: '#fff', alignItems: 'center', flexDirection: 'row', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  menuButton: { padding: 8 },
  topbarTitle: { fontSize: 16, fontWeight: '700', marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-start' },
  modalDrawer: { backgroundColor: '#fff', width: '80%', maxWidth: 320, height: '100%', padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
