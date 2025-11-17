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
import { profesoresApi } from '../api/profesores';
import { talleresApi } from '../api/talleres';
import { Profesor } from '../types';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '../components/SearchBar';
import HeaderWithSearch from '../components/HeaderWithSearch';
import { useResponsive } from '../hooks/useResponsive';
import { sharedStyles } from '../theme/sharedStyles';

const colors = {
  primary: '#0066cc',
};

const spacing = {
  xl: 20,
};

const ProfesoresScreen = () => {
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProfesor, setCurrentProfesor] = useState<Profesor | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    especialidad: '',
    email: '',
    contrasena: '',
  });

  const { isWeb, isDesktop } = useResponsive();
  const shouldShowTable = isWeb && isDesktop;
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    cargarProfesores();
  }, []);

  const cargarProfesores = async () => {
    setLoading(true);
    try {
      // Fetch profesores and talleres in parallel so we can compute workshops per professor
      const [profesData, talleresData] = await Promise.all([profesoresApi.listar(), talleresApi.listar()]);

      // Build a map professorId -> taller names
      const profTalleresMap: Record<number, string[]> = {};
      talleresData.forEach((t) => {
        if (!t.profesores || !Array.isArray(t.profesores)) return;
        t.profesores.forEach((p) => {
          const pid = Number(p.id);
          if (!profTalleresMap[pid]) profTalleresMap[pid] = [];
          profTalleresMap[pid].push(t.nombre);
        });
      });

      // Attach talleres list to each profesor for display (non-destructive)
      const merged = profesData.map((prof) => ({
        ...prof,
        talleres: profTalleresMap[prof.id] || [],
      }));

      setProfesores(merged as any);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCrear = () => {
    setIsEditing(false);
    setCurrentProfesor(null);
    setFormData({ nombre: '', especialidad: '', email: '', contrasena: '' });
    setModalVisible(true);
  };

  const abrirModalEditar = (profesor: Profesor) => {
    setIsEditing(true);
    setCurrentProfesor(profesor);
    setFormData({
      nombre: profesor.nombre,
      especialidad: profesor.especialidad || '',
      email: profesor.email || '',
      contrasena: '',
    });
    setModalVisible(true);
  };

  const guardarProfesor = async () => {
    if (!formData.nombre || !formData.especialidad || !formData.email) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    if (!isEditing && !formData.contrasena) {
      Alert.alert('Error', 'La contraseña es obligatoria para crear un profesor');
      return;
    }

    setLoading(true);
    try {
      if (isEditing && currentProfesor) {
        await profesoresApi.actualizar({
          id: currentProfesor.id,
          nombre: formData.nombre,
          especialidad: formData.especialidad,
          email: formData.email,
        });
        Alert.alert('Éxito', 'Profesor actualizado correctamente');
      } else {
        await profesoresApi.crear(formData as any);
        Alert.alert('Éxito', 'Profesor creado correctamente');
      }
      setModalVisible(false);
      cargarProfesores();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const eliminarProfesor = (profesor: Profesor) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de eliminar a ${profesor.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await profesoresApi.eliminar(profesor.id);
              Alert.alert('Éxito', 'Profesor eliminado correctamente');
              cargarProfesores();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const renderProfesor = ({ item }: { item: Profesor }) => (
    <View style={sharedStyles.card}>
      <View style={sharedStyles.cardContent}>
        <Text style={sharedStyles.cardTitle}>{item.nombre}</Text>
        <Text style={sharedStyles.cardDetail}>Especialidad: {item.especialidad}</Text>
        <Text style={sharedStyles.cardDetail}>Teléfono: {item.telefono || '-'}</Text>
        <Text style={sharedStyles.cardDetail}>Email: {(item as any).email || (item as any).profesor_email || '-'}</Text>
        <Text style={sharedStyles.cardDetail}>Talleres: {((item as any).talleres && (item as any).talleres.length) ? (item as any).talleres.join(', ') : '-'}</Text>
      </View>
      <View style={sharedStyles.cardActions}>
        <TouchableOpacity
          style={[sharedStyles.actionButton, sharedStyles.editButton]}
          onPress={() => abrirModalEditar(item)}
        >
          <Text style={sharedStyles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[sharedStyles.actionButton, sharedStyles.deleteButton]}
          onPress={() => eliminarProfesor(item)}
        >
          <Text style={sharedStyles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Se eliminó la representación en tabla. Usamos listas/ítems en tarjetas.

  const Container = isWeb ? View : SafeAreaView;

  return (
    <Container style={sharedStyles.container} edges={isWeb ? undefined : ['bottom']}>
      <View style={{ flex: 1 }}>
        <HeaderWithSearch
          title="Profesores"
          searchTerm={searchTerm}
          onSearch={setSearchTerm}
          onAdd={abrirModalCrear}
        />

        {isWeb ? (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true}>
            <View style={{ paddingBottom: spacing.xl }}>
              {loading && <ActivityIndicator size="large" color={colors.primary} style={sharedStyles.loader} />}

              {!loading && profesores.length === 0 && (
                <EmptyState message="No hay profesores registrados" icon={<Ionicons name="person" size={48} color={colors.primary || '#888'} />} />
              )}

              {!loading && profesores.length > 0 && (
                <FlatList
                  data={profesores}
                  renderItem={renderProfesor}
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

            {!loading && profesores.length === 0 && (
              <EmptyState message="No hay profesores registrados" icon={<Ionicons name="person" size={48} color={colors.primary || '#888'} />} />
            )}

            {!loading && profesores.length > 0 && (
              <FlatList
                data={profesores}
                renderItem={renderProfesor}
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
                  {isEditing ? 'Editar Profesor' : 'Nuevo Profesor'}
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
                  label="Especialidad"
                  required
                  value={formData.especialidad}
                  onChangeText={(text) => setFormData({ ...formData, especialidad: text })}
                  placeholder="Ej: Educación Física, Danza"
                />

                <Input
                  label="Email"
                  required
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="correo@ejemplo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                {!isEditing && (
                  <Input
                    label="Contraseña"
                    required
                    value={formData.contrasena}
                    onChangeText={(text) => setFormData({ ...formData, contrasena: text })}
                    placeholder="Contraseña"
                    secureTextEntry
                  />
                )}
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
                  onPress={guardarProfesor}
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

export default ProfesoresScreen;
