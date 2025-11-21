import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ListView from '../../src/components/ListView';
import { Profesor } from '../../src/types/entityTypes';
import { profesoresApi } from '../../src/api/profesores';
import { colors } from '../../src/theme/colors';

export default function ProfesoresIndex() {
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const cargarProfesores = async () => {
    try {
      const data = await profesoresApi.listar();
      setProfesores(data as Profesor[]);
    } catch (error) {
      console.error('Error cargando profesores:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProfesores();
  }, []);

  const handleItemPress = (profesor: Profesor) => {
    router.push(`/profesores/${profesor.id}`);
  };

  const handleCreate = () => {
    router.push('/profesores/create');
  };

  const handleSearch = (query: string) => {
    // Implement search logic if needed
    console.log('Search:', query);
  };

  const renderItemActions = (profesor: Profesor) => (
    <View style={styles.itemActions}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={(e) => {
          e.stopPropagation();
          router.push(`/profesores/${profesor.id}`);
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="create-outline" size={20} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={(e) => {
          e.stopPropagation();
          router.push(`/profesores/${profesor.id}`);
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
        entityType="profesor"
        data={profesores}
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