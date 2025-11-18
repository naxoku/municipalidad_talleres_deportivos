import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import ElegantModal from '../../src/components/Modal';

export default function NuevoAlumnoModal() {
  const router = useRouter();

  const onClose = () => {
    router.back();
  };

  return (
    <ElegantModal visible={true} onClose={onClose} title="Nuevo alumno">
      <View style={{ padding: 16 }}>
        <Text>Aquí va el formulario de nuevo alumno (migrar el form luego).</Text>
      </View>
    </ElegantModal>
  );
}
