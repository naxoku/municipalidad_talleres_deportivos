import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import EditForm from '../../../src/components/EditForm';
import { Taller } from '../../../src/types/entityTypes';
import { talleresApi } from '../../../src/api/talleres';

export default function EditTaller() {
  const [taller, setTaller] = useState<Taller | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const cargarTaller = useCallback(async () => {
    if (!id) return;
    const numericId = typeof id === 'string' ? parseInt(id, 10) : Array.isArray(id) ? parseInt(id[0], 10) : id;
    if (!numericId || isNaN(numericId)) return;
    
    try {
      const data = await talleresApi.obtener(numericId);
      if (data) {
        setTaller(data as Taller);
      } else {
        // Fallback: buscar en la lista completa
        const talleres = await talleresApi.listar();
        const found = talleres.find(t => t.id === numericId);
        if (found) {
          setTaller(found as Taller);
        }
      }
    } catch (error) {
      console.error('Error cargando taller:', error);
      // Fallback: buscar en la lista completa
      try {
        const talleres = await talleresApi.listar();
        const found = talleres.find(t => t.id === numericId);
        if (found) {
          setTaller(found as Taller);
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }
  }, [id]);

  useEffect(() => {
    cargarTaller();
  }, [cargarTaller]);

  const handleSave = async (data: any) => {
    if (!taller) return;
    setLoading(true);
    try {
      await talleresApi.actualizar({ id: taller.id, ...data });
      router.replace(`/talleres/${taller.id}`);
    } catch (error) {
      console.error('Error actualizando taller:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (!taller) {
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
        entityType="taller"
        data={taller}
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