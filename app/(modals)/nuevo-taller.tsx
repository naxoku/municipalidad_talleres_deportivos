import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import ElegantModal from '../../src/components/Modal';
import { talleresApi } from '../../src/api/talleres';
import { Input } from '../../src/components/Input';

export default function NuevoTallerModal() {
  const router = useRouter();
  const [tallerForm, setTallerForm] = useState({ nombre: '', descripcion: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const onClose = () => router.back();

  const submitNuevoTaller = async () => {
    if (!tallerForm.nombre) { Alert.alert('Nombre requerido'); return; }
    try {
      setActionLoading(true);
      const resp = await talleresApi.crear({ nombre: tallerForm.nombre, descripcion: tallerForm.descripcion });
      if (resp.status === 'success') {
        Alert.alert('Éxito', 'Taller creado');
        router.back();
      } else {
        Alert.alert('Error', resp.mensaje || 'No se pudo crear el taller');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || String(e));
    } finally { setActionLoading(false); }
  };

  return (
    <ElegantModal visible={true} onClose={onClose} title="Nuevo Taller">
      <View style={{ padding: 16 }}>
        <Input
          label="Nombre"
          required
          value={tallerForm.nombre}
          onChangeText={(text) => setTallerForm({ ...tallerForm, nombre: text })}
          placeholder="Nombre del taller"
        />

        <Input
          label="Descripción"
          value={tallerForm.descripcion}
          onChangeText={(text) => setTallerForm({ ...tallerForm, descripcion: text })}
          placeholder="Descripción (opcional)"
          multiline
          numberOfLines={3}
        />

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={onClose} style={{ padding: 12 }}>
            <Text style={{ color: '#2563EB' }}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={submitNuevoTaller} style={{ padding: 12 }}>
            {actionLoading ? <ActivityIndicator /> : <Text style={{ color: '#059669' }}>Crear Taller</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </ElegantModal>
  );
}
