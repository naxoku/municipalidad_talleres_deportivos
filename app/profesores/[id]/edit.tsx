import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import EditForm from '../../../src/components/EditForm';
import { Profesor } from '../../../src/types/entityTypes';
import { profesoresApi } from '../../../src/api/profesores';

export default function EditProfesor() {
  const [profesor, setProfesor] = useState<Profesor | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const cargarProfesor = useCallback(async () => {
    if (!id) return;
    const numericId = typeof id === 'string' ? parseInt(id, 10) : Array.isArray(id) ? parseInt(id[0], 10) : id;
    if (!numericId || isNaN(numericId)) return;
    
    try {
      const data = await profesoresApi.obtener(numericId);
      if (data) {
        setProfesor(data as Profesor);
      } else {
        // Fallback: buscar en la lista completa
        const profesores = await profesoresApi.listar();
        const found = profesores.find(p => p.id === numericId);
        if (found) {
          setProfesor(found as Profesor);
        }
      }
    } catch (error) {
      console.error('Error cargando profesor:', error);
      // Fallback: buscar en la lista completa
      try {
        const profesores = await profesoresApi.listar();
        const found = profesores.find(p => p.id === numericId);
        if (found) {
          setProfesor(found as Profesor);
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }
  }, [id]);

  useEffect(() => {
    cargarProfesor();
  }, [cargarProfesor]);

  const handleSave = async (data: any) => {
    if (!profesor) return;
    setLoading(true);
    try {
      await profesoresApi.actualizar({ id: profesor.id, ...data });
      router.replace(`/profesores/${profesor.id}`);
    } catch (error) {
      console.error('Error actualizando profesor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (!profesor) {
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
        entityType="profesor"
        data={profesor}
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