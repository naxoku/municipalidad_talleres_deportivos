import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Modal, TextInput, TouchableOpacity, Text, ActivityIndicator, StyleSheet, Animated, Easing, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { API_URL } from '../api/config';
import { colors, spacing, typography, shadows } from '../theme/colors';
import SearchBar from './SearchBar';

type Props = { navigation?: any; inline?: boolean };

export default function GlobalSearch({ inline = false }: Props) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<any>(null);
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const lastQueryRef = useRef('');
  const [visibleDropdown, setVisibleDropdown] = useState(false);

  const doSearch = useCallback(async (text: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/busqueda.php?q=${encodeURIComponent(text)}`);
      const json = await res.json();
      if (json.status === 'success') {
        const received: any[] = json.datos || [];
        // keep only results that match main fields (nombre/apellido for Personas, taller_nombre for Talleres)
        const q = (text || '').trim();
        const filtered = received.filter((it) => matchesMainFields(it, q));
        setResults(filtered);
      } else {
        setResults([]);
        setError(json.mensaje || 'Error en búsqueda');
      }
    } catch (e: any) {
      console.error('Search error', e);
      setError('Error de conexión');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const matchesMainFields = (it: any, q: string) => {
    if (!q) return true;
    try {
      const normalize = (s: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const nq = normalize(q);
      if (it.tipo === 'Estudiante' || it.tipo === 'Profesor') {
        const name = `${(it.nombre || '')} ${(it.apellido || '')}`.trim();
        return normalize(name).indexOf(nq) !== -1;
      }
      if (it.tipo === 'Taller') {
        const name = (it.taller_nombre || it.nombre || '');
        return normalize(name).indexOf(nq) !== -1;
      }
      // default: allow if any main-looking field matches
      return normalize(JSON.stringify(it)).indexOf(nq) !== -1;
    } catch {
      return true;
    }
  };

  const highlightNormalized = (text: string, q: string) => {
    if (!q) return text;
    const normalize = (s: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const norm = normalize(text);
    const nq = normalize(q);
    if (!nq) return text;

    // build mapping from normalized index -> original index
    const map: number[] = [];
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const nch = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      for (let k = 0; k < nch.length; k++) {
        map.push(i);
      }
    }

    const parts: any[] = [];
    let cursor = 0;
    let start = norm.indexOf(nq, cursor);
    while (start !== -1) {
      const endNorm = start + nq.length - 1;
      const origStart = map[start];
      const origEnd = map[endNorm];
      if (origStart === undefined || origEnd === undefined) break;
      if (origStart > cursor) {
        parts.push({ text: text.slice(cursor, origStart), highlight: false });
      }
      parts.push({ text: text.slice(origStart, origEnd + 1), highlight: true });
      cursor = origEnd + 1;
      start = norm.indexOf(nq, cursor && map[cursor] ? map.indexOf(cursor) : cursor);
      // fallback: search next using norm search from cursor translated
      if (start === -1) {
        // try to continue by searching in norm starting at map cursor length
        start = norm.indexOf(nq, start + 1);
        break;
      }
    }
    if (cursor < text.length) parts.push({ text: text.slice(cursor), highlight: false });

    return parts.map((p, i) => p.highlight ? (<Text key={i} style={styles.highlight}>{p.text}</Text>) : (<Text key={i}>{p.text}</Text>));
  };

  // close dropdown on outside click (only for inline mode and when there's query)
  useEffect(() => {
    if (!inline || query.length === 0) return;

    const handler = (event: MouseEvent) => {
      try {
        const node = containerRef.current as any;
        if (!node) return;
        // On web, the RN view ref is the DOM node and supports contains
        if (typeof node.contains === 'function') {
          if (!node.contains(event.target as Node)) {
            // close dropdown but keep the typed text
            setOpen(false);
            setResults([]);
            setTouched(false);
          }
        } else if (node._nativeTag) {
          // fallback: try to get element by id if available
          const el = document.getElementById(node._nativeTag as string);
          if (el && !el.contains(event.target as Node)) {
            // close dropdown but keep the typed text
            setOpen(false);
            setResults([]);
            setTouched(false);
          }
        }
      } catch {
        // ignore
      }
    };

    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [inline, query]);

  // animate dropdown open/close and control mounting for exit animation
  useEffect(() => {
    if (open) {
      setVisibleDropdown(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    } else {
      // animate out then unmount
      Animated.timing(anim, {
        toValue: 0,
        duration: 140,
        easing: Easing.in(Easing.ease),
        useNativeDriver: false,
      }).start(() => {
        setVisibleDropdown(false);
      });
    }
  }, [open, anim]);

  const buscar = (text: string) => {
    setQuery(text);
    setError(null);
    setOpen(true);
    // mount dropdown on next frame so the entrance animation runs smoothly
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => setVisibleDropdown(true));
    } else {
      setTimeout(() => setVisibleDropdown(true), 0);
    }
    // debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (text.length < 3) {
      setResults([]);
      return;
    }

    // schedule search
    // @ts-ignore
    debounceRef.current = setTimeout(() => {
      lastQueryRef.current = text;
      doSearch(text);
    }, 350) as unknown as number;
  };

  const onSelect = (item: any) => {
    setVisible(false);
    setQuery('');
    setResults([]);

    // Route based on tipo using Expo Router
    if (item.tipo === 'Estudiante') {
      router.push(`/alumnos?estudianteId=${item.id}`);
    } else if (item.tipo === 'Profesor') {
      router.push(`/profesores?profesorId=${item.id}`);
    } else if (item.tipo === 'Taller') {
      router.push(`/talleres?tallerId=${item.id}`);
    }
  };

  const groupResults = (items: any[]) => {
    const groups: Record<string, any[]> = {};
    items.forEach((it) => {
      const t = it.tipo || 'Otros';
      if (!groups[t]) groups[t] = [];
      groups[t].push(it);
    });
    return groups;
  };

  const highlight = (text: string, q: string) => {
    if (!q) return text;
    try {
      const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
      const parts = text.split(regex);
      return parts.map((part, i) => (
        regex.test(part) ? (
          // @ts-ignore
          <Text key={i} style={styles.highlight}>{part}</Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      ));
    } catch {
      return text;
    }
  };

  return (
    <>
      {inline ? (
        <View ref={containerRef} style={styles.inlineContainer}>
          <SearchBar
            value={query}
            onChange={buscar}
            placeholder="Buscar..."
            onClear={() => { setQuery(''); setResults([]); setError(null); setOpen(false); }}
            onFocus={() => { setTouched(true); setOpen(true); }}
          />

          {visibleDropdown && query.length > 0 ? (
            <Animated.View
              style={[
                styles.dropdown,
                {
                  opacity: anim,
                  transform: [
                    {
                      translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }),
                    },
                  ],
                  pointerEvents: query.length >= 3 ? 'auto' : 'none',
                },
              ]}
            >
              {query.length < 3 ? (
                touched ? (
                  <Text style={{ color: colors.text.secondary }}>Escribe al menos 3 caracteres</Text>
                ) : null
              ) : loading ? (
                <ActivityIndicator />
              ) : error ? (
                <Text style={{ color: colors.error }}>{error}</Text>
              ) : results.length === 0 ? (
                <Text style={{ color: colors.text.secondary }}>No se encontraron resultados</Text>
              ) : (
                (() => {
                  const groups = groupResults(results);
                  const order = ['Estudiante', 'Profesor', 'Taller'];
                  return (
                    <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={{ paddingBottom: 8 }}>
                      {order.map((tipo) => {
                        const list = groups[tipo] || [];
                        if (list.length === 0) return null;
                        return (
                          <View key={tipo}>
                            <View style={styles.sectionHeader}>
                              <Text style={styles.sectionHeaderText}>{tipo === 'Estudiante' ? 'Alumnos' : tipo === 'Profesor' ? 'Profesores' : 'Talleres'}</Text>
                            </View>
                            {list.map((item: any) => (
                              <TouchableOpacity key={`${item.tipo}-${item.id}`} onPress={() => onSelect(item)} style={styles.resultItem}>
                                <Text style={{ fontWeight: '600' }}>{typeof (item.nombre || item.taller_nombre || '') === 'string' ? highlight((item.nombre || item.taller_nombre || ''), query) : (item.nombre || item.taller_nombre || '')}</Text>
                                <Text style={{ color: colors.text.secondary, fontSize: typography.sizes.sm }}>{item.tipo} • {item.contacto || item.descripcion || ''}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        );
                      })}
                    </ScrollView>
                  );
                })()
              )}
            </Animated.View>
            ) : null}
          </View>
      ) : (
        <>
          <TouchableOpacity onPress={() => setVisible(true)} style={{ marginRight: 12 }}>
            <Ionicons name="search" size={22} color={colors.text.light} />
          </TouchableOpacity>

          <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.md }}>
              <View style={{ backgroundColor: '#fff', borderRadius: 8, padding: spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    placeholder="Buscar (mín 3 caracteres)..."
                    value={query}
                    onChangeText={buscar}
                    style={{ flex: 1, height: 44, borderWidth: 1, borderColor: '#eee', borderRadius: 8, paddingHorizontal: 12 }}
                    autoFocus
                    onFocus={() => setTouched(true)}
                  />
                  <TouchableOpacity onPress={() => { setVisible(false); setQuery(''); setResults([]); }} style={{ marginLeft: 8 }}>
                    <Ionicons name="close" size={22} color={colors.text.secondary} />
                  </TouchableOpacity>
                </View>

                <View style={{ marginTop: spacing.sm, maxHeight: 320 }}>
                  {query.length < 3 ? (
                    <Text style={{ color: colors.text.secondary }}>Escribe al menos 3 caracteres para buscar</Text>
                  ) : loading ? (
                    <ActivityIndicator />
                  ) : error ? (
                    <Text style={{ color: colors.error }}>{error}</Text>
                  ) : results.length === 0 ? (
                    <Text style={{ color: colors.text.secondary }}>No se encontraron resultados</Text>
                  ) : (
                    (() => {
                      const groups = groupResults(results);
                      const order = ['Estudiante', 'Profesor', 'Taller'];
                      return (
                        <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ paddingBottom: 8 }}>
                          {order.map((tipo) => {
                            const list = groups[tipo] || [];
                            if (list.length === 0) return null;
                            return (
                              <View key={tipo}>
                                <View style={styles.sectionHeader}>
                                  <Text style={styles.sectionHeaderText}>{tipo === 'Estudiante' ? 'Alumnos' : tipo === 'Profesor' ? 'Profesores' : 'Talleres'}</Text>
                                </View>
                                {list.map((item: any) => (
                                  <TouchableOpacity key={`${item.tipo}-${item.id}`} onPress={() => onSelect(item)} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f2f2f2' }}>
                                    <Text style={{ fontWeight: '600' }}>{typeof (item.nombre || item.taller_nombre || '') === 'string' ? highlightNormalized((item.nombre || item.taller_nombre || ''), query) : (item.nombre || item.taller_nombre || '')}</Text>
                                    <Text style={{ color: colors.text.secondary, fontSize: typography.sizes.sm }}>{item.tipo} • {item.contacto || item.descripcion || ''}</Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            );
                          })}
                        </ScrollView>
                      );
                    })()
                  )}
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  inlineContainer: {
    width: 480,
    maxWidth: 580,
    position: 'relative',
  },
  dropdown: {
    position: 'absolute',
    top: 52,
    right: 0,
    left: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    ...(shadows.lg as any),
    zIndex: 2000,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  resultItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    borderRadius: 6,
  }
  ,
  sectionHeader: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
  sectionHeaderText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '700',
    paddingVertical: 4,
  },
  highlight: {
    backgroundColor: 'rgba(250, 204, 21, 0.18)',
    color: '#b45309',
    fontWeight: '700',
  }
});
