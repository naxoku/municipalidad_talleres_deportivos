import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { talleresApi } from '../api/talleres';
import { queryKeys } from '../contexts/QueryContext';
import { Taller } from '../types/entityTypes';
import { useToast } from '../contexts/ToastContext';

// Hook para listar talleres
export function useTalleres() {
  return useQuery({
    queryKey: queryKeys.talleres.list(),
    queryFn: () => talleresApi.listar(),
  });
}

// Hook para obtener un taller específico
export function useTaller(id: number, include?: string) {
  return useQuery({
    queryKey: queryKeys.talleres.detailWithIncludes(id, include),
    queryFn: () => talleresApi.obtener(id, include),
    enabled: !!id && id > 0,
  });
}

// Hook para crear taller
export function useCreateTaller() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data: Omit<Taller, 'id'>) => talleresApi.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.talleres.all });
      showToast('Taller creado exitosamente', 'success');
    },
    onError: () => {
      showToast('Error al crear el taller', 'error');
    },
  });
}

// Hook para actualizar taller
export function useUpdateTaller() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Taller> }) => 
      talleresApi.actualizar(id, data),
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.talleres.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.talleres.detail(variables.id) });
      showToast('Taller actualizado exitosamente', 'success');
    },
    onError: () => {
      showToast('Error al actualizar el taller', 'error');
    },
  });
}

// Hook para eliminar taller
export function useDeleteTaller() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: number) => talleresApi.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.talleres.all });
      showToast('Taller eliminado exitosamente', 'success');
    },
    onError: () => {
      showToast('Error al eliminar el taller', 'error');
    },
  });
}
