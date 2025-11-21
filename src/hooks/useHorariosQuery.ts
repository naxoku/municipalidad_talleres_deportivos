import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { horariosApi } from '../api/horarios';
import { queryKeys } from '../contexts/QueryContext';
import { Horario } from '../types/entityTypes';
import { useToast } from '../contexts/ToastContext';

// Hook para listar horarios
export function useHorarios() {
  return useQuery({
    queryKey: queryKeys.horarios.list(),
    queryFn: () => horariosApi.listar(),
  });
}

// Hook para crear horario
export function useCreateHorario() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data: Omit<Horario, 'id'>) => horariosApi.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.horarios.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.talleres.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.profesores.all });
      showToast('Horario creado exitosamente', 'success');
    },
    onError: () => {
      showToast('Error al crear el horario', 'error');
    },
  });
}

// Hook para actualizar horario
export function useUpdateHorario() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data: Horario) => horariosApi.actualizar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.horarios.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.talleres.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.profesores.all });
      showToast('Horario actualizado exitosamente', 'success');
    },
    onError: () => {
      showToast('Error al actualizar el horario', 'error');
    },
  });
}

// Hook para eliminar horario
export function useDeleteHorario() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: number) => horariosApi.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.horarios.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.talleres.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.profesores.all });
      showToast('Horario eliminado exitosamente', 'success');
    },
    onError: () => {
      showToast('Error al eliminar el horario', 'error');
    },
  });
}
