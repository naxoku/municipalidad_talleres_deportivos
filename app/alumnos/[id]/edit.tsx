import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import EditForm from '../../../src/components/EditForm';
import { Alumno } from '../../../src/types/entityTypes';
import { alumnosApi } from '../../../src/api/alumnos';

export default function EditAlumno() {
  const [alumno, setAlumno] = useState<Alumno | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const cargarAlumno = useCallback(async () => {
    if (!id) return;
    const numericId = typeof id === 'string' ? parseInt(id, 10) : Array.isArray(id) ? parseInt(id[0], 10) : id;
    if (!numericId || isNaN(numericId)) return;
    
    try {
      const data = await alumnosApi.obtener(numericId);
      if (data) {
        setAlumno(data as Alumno);
      } else {
        // Fallback: buscar en la lista completa
        const alumnos = await alumnosApi.listar();
        const found = alumnos.find(a => a.id === numericId);
        if (found) {
          setAlumno(found as Alumno);
        }
      }
    } catch (error) {
      console.error('Error cargando alumno:', error);
      // Fallback: buscar en la lista completa
      try {
        const alumnos = await alumnosApi.listar();
        const found = alumnos.find(a => a.id === numericId);
        if (found) {
          setAlumno(found as Alumno);
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }
  }, [id]);

  useEffect(() => {
    cargarAlumno();
  }, [cargarAlumno]);

  const handleSave = async (data: any) => {
    if (!alumno) return;
    setLoading(true);
    try {
      await alumnosApi.actualizar({ id: alumno.id, ...data });
      router.replace(`/alumnos/${alumno.id}`);
    } catch (error) {
      console.error('Error actualizando alumno:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (!alumno) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loading}>
          {/* Loading state */}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <EditForm
        entityType="alumno"
        data={alumno}
        onSave={handleSave}
        onCancel={handleCancel}
        loading={loading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});