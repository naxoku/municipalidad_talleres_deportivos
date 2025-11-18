import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import ElegantModal from '../../src/components/Modal';
import { API_URL } from '../../src/api/config';

export default function ExportarModal() {
  const router = useRouter();
  const [exportLoading, setExportLoading] = useState(false);

  const onClose = () => router.back();

  const handleExport = async (ds: string) => {
    try {
      setExportLoading(true);
      const url = `${API_URL}/api/reportes.php?action=exportar_csv&dataset=${ds}`;
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        Alert.alert('Exportar', `Se generó el CSV. URL: ${url}`);
      }
      router.back();
    } catch (e) {
      Alert.alert('Error', 'No se pudo generar el archivo');
    } finally { setExportLoading(false); }
  };

  return (
    <ElegantModal visible={true} onClose={onClose} title="Exportar CSV">
      <View style={{ padding: 16 }}>
        <Text style={{ marginBottom: 8 }}>Elige el conjunto de datos a exportar:</Text>
        {['Alumnos','inscripciones','clases','talleres'].map((ds) => (
          <TouchableOpacity key={ds} style={{ paddingVertical: 8 }} onPress={() => handleExport(ds)}>
            <Text>{ds}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ElegantModal>
  );
}
