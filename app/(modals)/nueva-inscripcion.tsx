import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import ElegantModal from '../../src/components/Modal';
import { alumnosApi } from '../../src/api/alumnos';
import { talleresApi } from '../../src/api/talleres';
import { inscripcionesApi } from '../../src/api/inscripciones';
import { Select } from '../../src/components/Select';

export default function NuevaInscripcionModal() {
  const router = useRouter();
  const [inscriptionForm, setInscriptionForm] = useState({ estudianteId: '', tallerId: '' });
  const [AlumnosList, setAlumnosList] = useState<any[]>([]);
  const [talleresList, setTalleresList] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setActionLoading(true);
        const [ests, talls] = await Promise.all([alumnosApi.listar(), talleresApi.listar()]);
        setAlumnosList(ests || []);
        setTalleresList(talls || []);
      } catch (e) {
        Alert.alert('Error cargando datos');
      } finally { setActionLoading(false); }
    })();
  }, []);

  const onClose = () => router.back();

  const submitNuevaInscripcion = async () => {
    if (!inscriptionForm.estudianteId || !inscriptionForm.tallerId) { Alert.alert('Selecciona estudiante y taller'); return; }
    try {
      setActionLoading(true);
      const resp = await inscripcionesApi.crear({ estudiante_id: Number(inscriptionForm.estudianteId), taller_id: Number(inscriptionForm.tallerId) });
      if (resp.status === 'success') {
        Alert.alert('Éxito', 'Inscripción creada');
        router.back();
      } else {
        Alert.alert('Error', resp.mensaje || 'No se pudo crear la inscripción');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || String(e));
    } finally { setActionLoading(false); }
  };

  return (
    <ElegantModal visible={true} onClose={onClose} title="Nueva Inscripción">
      <View style={{ padding: 16 }}>
        <View style={{ marginBottom: 12 }}>
          <Text style={{ marginBottom: 6 }}>Estudiante</Text>
          <Select
            label="Estudiante"
            value={inscriptionForm.estudianteId}
            onValueChange={(v: any) => setInscriptionForm({ ...inscriptionForm, estudianteId: String(v) })}
            items={(AlumnosList || []).map((e: any) => ({ label: e.nombre, value: e.id }))}
          />
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ marginBottom: 6 }}>Taller</Text>
          <Select
            label="Taller"
            value={inscriptionForm.tallerId}
            onValueChange={(v: any) => setInscriptionForm({ ...inscriptionForm, tallerId: String(v) })}
            items={(talleresList || []).map((t: any) => ({ label: t.nombre, value: t.id }))}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={onClose} style={{ padding: 12 }}>
            <Text style={{ color: '#2563EB' }}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={submitNuevaInscripcion} style={{ padding: 12 }}>
            {actionLoading ? <ActivityIndicator /> : <Text style={{ color: '#059669' }}>Crear Inscripción</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </ElegantModal>
  );
}
