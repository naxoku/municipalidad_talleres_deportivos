import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ListView from '../../src/components/ListView';
import { Alumno } from '../../src/types/entityTypes';
import { alumnosApi } from '../../src/api/alumnos';
import { colors } from '../../src/theme/colors';

export default function AlumnosIndex() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const cargarAlumnos = async () => {
    try {
      const data = await alumnosApi.listar();
      setAlumnos(data as Alumno[]);
    } catch (error) {
      console.error('Error cargando alumnos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAlumnos();
  }, []);

  const handleItemPress = (alumno: Alumno) => {
    router.push(`/alumnos/${alumno.id}`);
  };

  const handleCreate = () => {
    router.push('/alumnos/create');
  };

  const handleSearch = (query: string) => {
    // Implement search logic if needed
    console.log('Search:', query);
  };

  const renderItemActions = (alumno: Alumno) => (
    <View style={styles.itemActions}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={(e) => {
          e.stopPropagation();
          router.push(`/alumnos/${alumno.id}`);
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="create-outline" size={20} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={(e) => {
          e.stopPropagation();
          router.push(`/alumnos/${alumno.id}`);
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.success} />
      </TouchableOpacity>
      <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} style={{ marginLeft: 8 }} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ListView
        entityType="alumno"
        data={alumnos}
        onItemPress={handleItemPress}
        onCreate={handleCreate}
        onSearch={handleSearch}
        loading={loading}
        renderItemActions={renderItemActions}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
});