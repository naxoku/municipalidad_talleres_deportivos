import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alumnosApi } from '../api/alumnos';
import { queryKeys } from '../contexts/QueryContext';
import { Alumno } from '../types/entityTypes';
import { useToast } from '../contexts/ToastContext';

// Hook para listar alumnos
export function useAlumnos() {
  return useQuery({
    queryKey: queryKeys.alumnos.list(),
    queryFn: () => alumnosApi.listar(),
  });
}

// Hook para obtener un alumno específico
export function useAlumno(id: number, include?: string) {
  return useQuery({
    queryKey: queryKeys.alumnos.detailWithIncludes(id, include),
    queryFn: () => alumnosApi.obtener(id, include),
    enabled: !!id && id > 0,
  });
}

// Hook para crear alumno
export function useCreateAlumno() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data: any) => alumnosApi.crear(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alumnos.all });
      showToast('Alumno creado exitosamente', 'success');
    },
    onError: () => {
      showToast('Error al crear el alumno', 'error');
    },
  });
}

// Hook para actualizar alumno
export function useUpdateAlumno() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Alumno> }) => 
      alumnosApi.actualizar(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alumnos.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.alumnos.detail(variables.id) });
      showToast('Alumno actualizado exitosamente', 'success');
    },
    onError: () => {
      showToast('Error al actualizar el alumno', 'error');
    },
  });
}

// Hook para eliminar alumno
export function useDeleteAlumno() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: number) => alumnosApi.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alumnos.all });
      showToast('Alumno eliminado exitosamente', 'success');
    },
    onError: () => {
      showToast('Error al eliminar el alumno', 'error');
    },
  });
}
