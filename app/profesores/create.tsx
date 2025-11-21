import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import EditForm from '../../src/components/EditForm';
import { profesoresApi } from '../../src/api/profesores';

export default function CreateProfesor() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSave = async (data: any) => {
    setLoading(true);
    try {
      await profesoresApi.crear(data);
      router.replace('/profesores');
    } catch (error) {
      console.error('Error creando profesor:', error);
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
        entityType="profesor"
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