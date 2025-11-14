import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { asistenciaApi } from '../api/asistencia';
import { clasesApi } from '../api/clases';
import { Asistencia, Clase } from '../types';
import { EmptyState } from '../components/EmptyState';

const AsistenciaScreen = () => {
  const [clases, setClases] = useState<Clase[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [claseSeleccionada, setClaseSeleccionada] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [mostrarClases, setMostrarClases] = useState(true);

  useEffect(() => {
    cargarClases();
  }, []);

  const cargarClases = async () => {
    setLoading(true);
    try {
      const data = await clasesApi.listar();
      setClases(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarAsistencia = async (claseId: number) => {
    setLoading(true);
    try {
      const data = await asistenciaApi.listarPorClase(claseId);
      setAsistencias(data);
      setClaseSeleccionada(claseId);
      setMostrarClases(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const marcarAsistencia = async (id: number, presente: boolean) => {
    try {
      await asistenciaApi.marcar(id, presente);
      if (claseSeleccionada) {
        cargarAsistencia(claseSeleccionada);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const volverAClases = () => {
    setMostrarClases(true);
    setClaseSeleccionada(null);
    setAsistencias([]);
  };

  const renderClase = ({ item }: { item: Clase }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => cargarAsistencia(item.id)}
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.taller_nombre || `Taller ID: ${item.taller_id}`}</Text>
        <Text style={styles.cardDetail}>Fecha: {item.fecha}</Text>
        <Text style={styles.cardDetail}>Horario: {item.hora_inicio} - {item.hora_fin}</Text>
      </View>
      <View style={styles.cardArrow}>
        <Ionicons name="chevron-forward" size={24} color="#999" />
      </View>
    </TouchableOpacity>
  );

  const renderAsistencia = ({ item }: { item: Asistencia }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.estudiante_nombre || `Estudiante ID: ${item.estudiante_id}`}</Text>
        <View style={styles.statusContainer}>
          <Ionicons 
            name={item.presente ? 'checkmark-circle' : 'close-circle'} 
            size={18} 
            color={item.presente ? '#28a745' : '#dc3545'}
          />
          <Text style={[styles.status, item.presente ? styles.statusPresente : styles.statusAusente]}>
            {item.presente ? 'Presente' : 'Ausente'}
          </Text>
        </View>
      </View>
      <View style={styles.asistenciaButtons}>
        <TouchableOpacity
          style={[styles.asistenciaButton, styles.presenteButton, item.presente && styles.buttonActive]}
          onPress={() => marcarAsistencia(item.id, true)}
        >
          <Text style={styles.asistenciaButtonText}>Presente</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.asistenciaButton, styles.ausenteButton, !item.presente && styles.buttonActive]}
          onPress={() => marcarAsistencia(item.id, false)}
        >
          <Text style={styles.asistenciaButtonText}>Ausente</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        {!mostrarClases && (
          <TouchableOpacity onPress={volverAClases} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#0066cc" />
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>
          {mostrarClases ? 'Seleccionar Clase' : 'Registro de Asistencia'}
        </Text>
      </View>

      {loading && <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />}

      {!loading && mostrarClases && clases.length === 0 && (
        <EmptyState message="No hay clases registradas" />
      )}

      {!loading && mostrarClases && clases.length > 0 && (
        <FlatList
          data={clases}
          renderItem={renderClase}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}

      {!loading && !mostrarClases && asistencias.length === 0 && (
        <EmptyState message="No hay estudiantes inscritos en esta clase" />
      )}

      {!loading && !mostrarClases && asistencias.length > 0 && (
        <FlatList
          data={asistencias}
          renderItem={renderAsistencia}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0066cc',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  loader: {
    marginTop: 20,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#fd7e14',
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cardDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardArrow: {
    marginLeft: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusPresente: {
    color: '#28a745',
  },
  statusAusente: {
    color: '#dc3545',
  },
  asistenciaButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  asistenciaButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
  },
  presenteButton: {
    borderColor: '#28a745',
    backgroundColor: '#fff',
  },
  ausenteButton: {
    borderColor: '#dc3545',
    backgroundColor: '#fff',
  },
  buttonActive: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  asistenciaButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default AsistenciaScreen;
