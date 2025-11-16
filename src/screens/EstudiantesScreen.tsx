import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { estudiantesApi } from '../api/estudiantes';
import { Estudiante } from '../types';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import SearchBar from '../components/SearchBar';
import { useResponsive } from '../hooks/useResponsive';
import { useAuth } from '../contexts/AuthContext';
import { sharedStyles } from '../theme/sharedStyles';

const colors = {
  primary: '#0066cc',
};

const spacing = {
  xl: 20,
};

const EstudiantesScreen = () => {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEstudiante, setCurrentEstudiante] = useState<Estudiante | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    edad: '',
    contacto: '',
  });

  const { isWeb, isDesktop } = useResponsive();
  const shouldShowTable = isWeb && isDesktop;
  const [searchTerm, setSearchTerm] = useState('');
  const { userRole } = useAuth();
  const isAdmin = userRole === 'administrador';

  useEffect(() => {
    cargarEstudiantes();
  }, []);

  const cargarEstudiantes = async () => {
    setLoading(true);
    try {
      const data = await estudiantesApi.listar();
      setEstudiantes(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCrear = () => {
    setIsEditing(false);
    setCurrentEstudiante(null);
    setFormData({ nombre: '', edad: '', contacto: '' });
    setModalVisible(true);
  };

  const abrirModalEditar = (estudiante: Estudiante) => {
    setIsEditing(true);
    setCurrentEstudiante(estudiante);
    setFormData({
      nombre: estudiante.nombre,
      edad: estudiante.edad?.toString() || '',
      contacto: estudiante.contacto || '',
    });
    setModalVisible(true);
  };

  const guardarEstudiante = async () => {
    if (!formData.nombre) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    setLoading(true);
    try {
      const data = {
        nombre: formData.nombre,
        edad: formData.edad ? parseInt(formData.edad) : undefined,
        contacto: formData.contacto || undefined,
      };

      if (isEditing && currentEstudiante) {
        await estudiantesApi.actualizar({ id: currentEstudiante.id, ...data } as Estudiante);
        Alert.alert('Éxito', 'Estudiante actualizado correctamente');
      } else {
        await estudiantesApi.crear(data);
        Alert.alert('Éxito', 'Estudiante creado correctamente');
      }
      setModalVisible(false);
      cargarEstudiantes();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const eliminarEstudiante = (estudiante: Estudiante) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de eliminar a ${estudiante.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await estudiantesApi.eliminar(estudiante.id);
              Alert.alert('Éxito', 'Estudiante eliminado correctamente');
              cargarEstudiantes();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const renderEstudiante = ({ item }: { item: Estudiante }) => (
    <View style={sharedStyles.card}>
      <View style={sharedStyles.cardContent}>
        <Text style={sharedStyles.cardTitle}>{item.nombre}</Text>
        {item.edad && <Text style={sharedStyles.cardDetail}>Edad: {item.edad} años</Text>}
        {item.contacto && <Text style={sharedStyles.cardDetail}>Contacto: {item.contacto}</Text>}
      </View>
      {isAdmin && (
        <View style={sharedStyles.cardActions}>
          <TouchableOpacity
            style={[sharedStyles.actionButton, sharedStyles.editButton]}
            onPress={() => abrirModalEditar(item)}
          >
            <Text style={sharedStyles.actionButtonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[sharedStyles.actionButton, sharedStyles.deleteButton]}
            onPress={() => eliminarEstudiante(item)}
          >
            <Text style={sharedStyles.actionButtonText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Se eliminó la representación en tabla. Usamos listas/ítems en tarjetas.

  const Container = isWeb ? View : SafeAreaView;

  return (
    <Container style={sharedStyles.container} edges={isWeb ? undefined : ['bottom']}>
      <View style={{ flex: 1 }}>
        <View style={[sharedStyles.header, { flexDirection: 'column' }] }>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Text style={sharedStyles.headerTitle}>{isAdmin ? 'Estudiantes' : 'Mis Estudiantes'}</Text>
            {isAdmin && (
              <TouchableOpacity style={sharedStyles.addButton} onPress={abrirModalCrear}>
                <Text style={sharedStyles.addButtonText}>+ Nuevo</Text>
              </TouchableOpacity>
            )}
          </View>
          {isWeb && shouldShowTable && (
            <View style={{ marginTop: 12, width: '100%' }}>
              <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Buscar estudiantes..." onClear={() => setSearchTerm('')} />
            </View>
          )}
        </View>

        {isWeb ? (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={{ paddingBottom: spacing.xl }}>
              {loading && <ActivityIndicator size="large" color={colors.primary} style={sharedStyles.loader} />}

              {!loading && estudiantes.length === 0 && (
                <EmptyState message="No hay estudiantes registrados" />
              )}

              {!loading && estudiantes.length > 0 && (
                <FlatList
                  data={estudiantes}
                  renderItem={renderEstudiante}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={sharedStyles.listContent}
                  scrollEnabled={false}
                />
              )}
            </View>
          </ScrollView>
        ) : (
          <>
            {loading && <ActivityIndicator size="large" color={colors.primary} style={sharedStyles.loader} />}

            {!loading && estudiantes.length === 0 && (
              <EmptyState message="No hay estudiantes registrados" />
            )}

            {!loading && estudiantes.length > 0 && (
              <FlatList
                data={estudiantes}
                renderItem={renderEstudiante}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={sharedStyles.listContent}
              />
            )}
          </>
        )}
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[sharedStyles.modalOverlay, isWeb && sharedStyles.webModalOverlay]}>
          <SafeAreaView style={[sharedStyles.modalSafeArea, isWeb && sharedStyles.webModalSafeArea]} edges={isWeb ? [] : ['bottom']}>
            <View style={[sharedStyles.modalContent, isWeb && sharedStyles.webModalContent]}>
              <View style={sharedStyles.modalHeader}>
                <Text style={sharedStyles.modalTitle}>
                  {isEditing ? 'Editar Estudiante' : 'Nuevo Estudiante'}
                </Text>
              </View>

              <ScrollView style={sharedStyles.modalBody} showsVerticalScrollIndicator={false}>
                <Input
                  label="Nombre"
                  required
                  value={formData.nombre}
                  onChangeText={(text) => setFormData({ ...formData, nombre: text })}
                  placeholder="Nombre completo"
                />

                <Input
                  label="Edad"
                  value={formData.edad}
                  onChangeText={(text) => setFormData({ ...formData, edad: text.replace(/[^0-9]/g, '') })}
                  placeholder="Edad en años"
                  keyboardType="numeric"
                />

                <Input
                  label="Contacto"
                  value={formData.contacto}
                  onChangeText={(text) => setFormData({ ...formData, contacto: text })}
                  placeholder="Teléfono o email"
                />
              </ScrollView>

              <View style={sharedStyles.modalFooter}>
                <Button
                  title="Cancelar"
                  variant="secondary"
                  onPress={() => setModalVisible(false)}
                  style={sharedStyles.modalButton}
                />
                <Button
                  title={isEditing ? 'Actualizar' : 'Crear'}
                  variant="success"
                  onPress={guardarEstudiante}
                  loading={loading}
                  style={sharedStyles.modalButton}
                />
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </Container>
  );
};

// Estilos locales ya no son necesarios, se usan sharedStyles
const styles = StyleSheet.create({});

export default EstudiantesScreen;
