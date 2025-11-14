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
import { talleresApi } from '../api/talleres';
import { profesoresApi } from '../api/profesores';
import { Taller, Profesor } from '../types';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Table, TableColumn, TableAction } from '../components/Table';
import { useResponsive } from '../hooks/useResponsive';
import { colors } from '../theme/colors';
import { sharedStyles } from '../theme/sharedStyles';

const TalleresScreen = () => {
  const [talleres, setTalleres] = useState<Taller[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTaller, setCurrentTaller] = useState<Taller | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
  });

  const { isWeb, isDesktop } = useResponsive();
  const shouldShowTable = isWeb && isDesktop;

  useEffect(() => {
    cargarTalleres();
    cargarProfesores();
  }, []);

  const cargarTalleres = async () => {
    setLoading(true);
    try {
      const data = await talleresApi.listar();
      setTalleres(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarProfesores = async () => {
    try {
      const data = await profesoresApi.listar();
      setProfesores(data);
    } catch (error: any) {
      console.error('Error cargando profesores:', error);
    }
  };

  const abrirModalCrear = () => {
    setIsEditing(false);
    setCurrentTaller(null);
    setFormData({ nombre: '', descripcion: '' });
    setModalVisible(true);
  };

  const abrirModalEditar = (taller: Taller) => {
    setIsEditing(true);
    setCurrentTaller(taller);
    setFormData({
      nombre: taller.nombre,
      descripcion: taller.descripcion || '',
    });
    setModalVisible(true);
  };

  const guardarTaller = async () => {
    if (!formData.nombre) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    setLoading(true);
    try {
      const data = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
      };

      if (isEditing && currentTaller) {
        await talleresApi.actualizar({ id: currentTaller.id, ...data } as Taller);
        Alert.alert('Éxito', 'Taller actualizado correctamente');
      } else {
        await talleresApi.crear(data);
        Alert.alert('Éxito', 'Taller creado correctamente');
      }
      setModalVisible(false);
      cargarTalleres();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const eliminarTaller = (taller: Taller) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de eliminar el taller "${taller.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await talleresApi.eliminar(taller.id);
              Alert.alert('Éxito', 'Taller eliminado correctamente');
              cargarTalleres();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const renderTaller = ({ item }: { item: Taller }) => (
    <View style={sharedStyles.card}>
      <View style={sharedStyles.cardContent}>
        <Text style={sharedStyles.cardTitle}>{item.nombre}</Text>
        {item.descripcion && <Text style={sharedStyles.cardDetail}>Descripción: {item.descripcion}</Text>}
        {item.profesores && item.profesores.length > 0 && <Text style={sharedStyles.cardDetail}>Profesores: {item.profesores.map((p: any) => p.nombre).join(', ')}</Text>}
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
          onPress={() => eliminarTaller(item)}
        >
          <Text style={sharedStyles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const tableColumns: TableColumn<Taller>[] = [
    { key: 'nombre', header: 'Nombre', render: (item) => item.nombre },
    { key: 'descripcion', header: 'Descripción', render: (item) => item.descripcion || '-' },
    { key: 'profesores', header: 'Profesores', render: (item) => item.profesores?.map((p: any) => p.nombre).join(', ') || '-' },
  ];

  const tableActions: TableAction<Taller>[] = [
    { label: 'Editar', onPress: abrirModalEditar, color: colors.blue.main },
    { label: 'Eliminar', onPress: eliminarTaller, color: colors.error },
  ];

  const Container = isWeb ? View : SafeAreaView;

  return (
    <Container style={sharedStyles.container} edges={isWeb ? undefined : ['bottom']}>
      <View style={[sharedStyles.contentWrapper, isWeb && sharedStyles.webContentWrapper]}>
        <View style={sharedStyles.header}>
          <Text style={sharedStyles.headerTitle}>Talleres</Text>
          <TouchableOpacity style={sharedStyles.addButton} onPress={abrirModalCrear}>
            <Text style={sharedStyles.addButtonText}>+ Nuevo</Text>
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator size="large" color={colors.primary} style={sharedStyles.loader} />}

        {!loading && talleres.length === 0 && (
          <EmptyState message="No hay talleres registrados" />
        )}

        {!loading && talleres.length > 0 && shouldShowTable && (
          <View style={sharedStyles.tableContainer}>
            <Table
              columns={tableColumns}
              data={talleres}
              keyExtractor={(item) => item.id.toString()}
              actions={tableActions}
            />
          </View>
        )}

        {!loading && talleres.length > 0 && !shouldShowTable && (
          <FlatList
            data={talleres}
            renderItem={renderTaller}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={sharedStyles.listContent}
          />
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
                  {isEditing ? 'Editar Taller' : 'Nuevo Taller'}
                </Text>
              </View>

              <ScrollView style={sharedStyles.modalBody} showsVerticalScrollIndicator={false}>
                <Input
                  label="Nombre"
                  required
                  value={formData.nombre}
                  onChangeText={(text) => setFormData({ ...formData, nombre: text })}
                  placeholder="Nombre del taller"
                />

                <Input
                  label="Descripción"
                  value={formData.descripcion}
                  onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
                  placeholder="Descripción del taller"
                  multiline
                  numberOfLines={3}
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
                  onPress={guardarTaller}
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

export default TalleresScreen;
