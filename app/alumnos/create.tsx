import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import EditForm from '../../src/components/EditForm';
import { alumnosApi } from '../../src/api/alumnos';

export default function CreateAlumno() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSave = async (data: any) => {
    setLoading(true);
    try {
      await alumnosApi.crear(data);
      router.replace('/alumnos');
    } catch (error) {
      console.error('Error creando alumno:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <EditForm
        entityType="alumno"
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
});