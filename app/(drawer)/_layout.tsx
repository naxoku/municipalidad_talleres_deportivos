import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Slot, Link, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import GlobalSearch from '../../src/components/GlobalSearch';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors, spacing, shadows } from '../../src/theme/colors';

export default function DrawerLayout() {
  const segments = useSegments();
  const { isWeb, isDesktop } = useResponsive();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'administrador';
  const isProfesor = userRole === 'profesor';
  const [open, setOpen] = useState(false);

  const makeLink = (href: string, label: string, icon?: string) => {
    const active = segments.join('/').includes(href.replace(/^\//, ''));
    return (
      <Link key={href} href={href} style={[styles.link, active && styles.linkActive]}>
        <View style={styles.linkContent}>
          {icon && <Ionicons name={icon as any} size={18} color={active ? colors.text.light : '#fff'} />}
          <Text style={[styles.linkText, active && styles.linkTextActive]}>{label}</Text>
        </View>
      </Link>
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

  return (
    <View style={styles.container}>
      {/* Permanent sidebar for desktop/web */}
      {isWeb && isDesktop ? (
        <View style={styles.sidebar}>
          <Text style={styles.brand}>Talleres municipales</Text>
          <View style={styles.searchWrap}>
            <GlobalSearch inline />
          </View>
          <ScrollView style={styles.links}>
            {links.map((l) => makeLink(l.href, l.label, l.icon))}
          </ScrollView>
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

      {/* Content */}
      <View style={styles.content}>
        <Slot />
      </View>

      {/* Modal drawer for mobile */}
      <Modal visible={open} animationType="slide" transparent={true} onRequestClose={() => setOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalDrawer}>
            <View style={styles.modalHeader}>
              <Text style={styles.brand}>Menú</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Ionicons name="close" size={22} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ marginTop: 12 }}>{links.map((l) => makeLink(l.href, l.label, l.icon))}</ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#F8FAFB' },
  sidebar: { width: 250, backgroundColor: colors.primary, paddingTop: 24, paddingHorizontal: 12, height: '100%' },
  brand: { color: colors.text.light, fontWeight: '700', fontSize: 18, marginBottom: 12 },
  searchWrap: { marginBottom: 12 },
  links: { marginTop: 8 },
  link: { paddingVertical: 10, paddingHorizontal: 10, borderRadius: 8, marginVertical: 4 },
  linkActive: { backgroundColor: colors.primaryLight },
  linkContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  linkText: { color: '#fff', marginLeft: 8, fontWeight: '600' },
  linkTextActive: { color: colors.text.light },
  content: { flex: 1, minHeight: '100%' },
  topbar: { height: 64, backgroundColor: '#fff', alignItems: 'center', flexDirection: 'row', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  menuButton: { padding: 8 },
  topbarTitle: { fontSize: 16, fontWeight: '700', marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-start' },
  modalDrawer: { backgroundColor: '#fff', width: '80%', maxWidth: 320, height: '100%', padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
