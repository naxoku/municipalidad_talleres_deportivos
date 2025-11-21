import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profesoresApi } from '../api/profesores';
import { queryKeys } from '../contexts/QueryContext';
import { Profesor } from '../types/entityTypes';
import { useToast } from '../contexts/ToastContext';

// Hook para listar profesores
export function useProfesores() {
  return useQuery({
    queryKey: queryKeys.profesores.list(),
    queryFn: () => profesoresApi.listar(),
  });
}

// Hook para obtener un profesor específico
export function useProfesor(id: number, include?: string) {
  return useQuery({
    queryKey: queryKeys.profesores.detailWithIncludes(id, include),
    queryFn: () => profesoresApi.obtener(id, include),
    enabled: !!id && id > 0,
  });
}

// Hook para crear profesor
export function useCreateProfesor() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data: Omit<Profesor, 'id'> & { contrasena: string }) => profesoresApi.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profesores.all });
      showToast('Profesor creado exitosamente', 'success');
    },
    onError: () => {
      showToast('Error al crear el profesor', 'error');
    },
  });
}

// Hook para actualizar profesor
export function useUpdateProfesor() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Profesor> }) => 
      profesoresApi.actualizar(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profesores.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.profesores.detail(variables.id) });
      showToast('Profesor actualizado exitosamente', 'success');
    },
    onError: () => {
      showToast('Error al actualizar el profesor', 'error');
    },
  });
}

// Hook para eliminar profesor
export function useDeleteProfesor() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: number) => profesoresApi.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profesores.all });
      showToast('Profesor eliminado exitosamente', 'success');
    },
    onError: () => {
      showToast('Error al eliminar el profesor', 'error');
    },
  });
}
