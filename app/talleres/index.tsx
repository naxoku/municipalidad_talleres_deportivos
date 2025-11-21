import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ListView from '../../src/components/ListView';
import { Taller } from '../../src/types/entityTypes';
import { talleresApi } from '../../src/api/talleres';
import { colors } from '../../src/theme/colors';

export default function TalleresIndex() {
  const [talleres, setTalleres] = useState<Taller[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const cargarTalleres = async () => {
    try {
      const data = await talleresApi.listar();
      setTalleres(data as Taller[]);
    } catch (error) {
      console.error('Error cargando talleres:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTalleres();
  }, []);

  const handleItemPress = (taller: Taller) => {
    router.push(`/talleres/${taller.id}`);
  };

  const handleCreate = () => {
    router.push('/talleres/create');
  };

  const handleSearch = (query: string) => {
    // Implement search logic if needed
    console.log('Search:', query);
  };

  const renderItemActions = (taller: Taller) => (
    <View style={styles.itemActions}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={(e) => {
          e.stopPropagation();
          router.push(`/talleres/${taller.id}`);
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="create-outline" size={20} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={(e) => {
          e.stopPropagation();
          router.push(`/talleres/${taller.id}`);
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="person-add-outline" size={20} color={colors.success} />
      </TouchableOpacity>
      <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} style={{ marginLeft: 8 }} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ListView
        entityType="taller"
        data={talleres}
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
