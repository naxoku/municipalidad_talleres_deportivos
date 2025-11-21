import React, { createContext, useContext } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Configuración del QueryClient con opciones optimizadas
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tiempo que los datos se consideran frescos (5 minutos)
      staleTime: 5 * 60 * 1000,
      // Tiempo de cache antes de garbage collection (10 minutos)
      gcTime: 10 * 60 * 1000,
      // Reintentos en caso de error
      retry: 1,
      // No refetch automático en focus/mount para mobile
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      // Reintentos en mutaciones
      retry: 1,
    },
  },
});

interface QueryContextValue {
  queryClient: QueryClient;
}

const QueryContext = createContext<QueryContextValue | undefined>(undefined);

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryContext.Provider value={{ queryClient }}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </QueryContext.Provider>
  );
}

export function useQueryContext() {
  const context = useContext(QueryContext);
  if (!context) {
    throw new Error('useQueryContext must be used within QueryProvider');
  }
  return context;
}

// Helper para invalidar queries
export const invalidateQueries = (queryKey: string[]) => {
  queryClient.invalidateQueries({ queryKey });
};

// Helper para refetch queries
export const refetchQueries = (queryKey: string[]) => {
  queryClient.refetchQueries({ queryKey });
};

// Query keys centralizados
export const queryKeys = {
  talleres: {
    all: ['talleres'] as const,
    list: () => [...queryKeys.talleres.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.talleres.all, 'detail', id] as const,
    detailWithIncludes: (id: number, includes?: string) => 
      [...queryKeys.talleres.all, 'detail', id, includes] as const,
  },
  profesores: {
    all: ['profesores'] as const,
    list: () => [...queryKeys.profesores.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.profesores.all, 'detail', id] as const,
    detailWithIncludes: (id: number, includes?: string) => 
      [...queryKeys.profesores.all, 'detail', id, includes] as const,
  },
  alumnos: {
    all: ['alumnos'] as const,
    list: () => [...queryKeys.alumnos.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.alumnos.all, 'detail', id] as const,
    detailWithIncludes: (id: number, includes?: string) => 
      [...queryKeys.alumnos.all, 'detail', id, includes] as const,
  },
  horarios: {
    all: ['horarios'] as const,
    list: () => [...queryKeys.horarios.all, 'list'] as const,
  },
  clases: {
    all: ['clases'] as const,
    list: () => [...queryKeys.clases.all, 'list'] as const,
    upcoming: () => [...queryKeys.clases.all, 'upcoming'] as const,
  },
  inscripciones: {
    all: ['inscripciones'] as const,
    list: () => [...queryKeys.inscripciones.all, 'list'] as const,
  },
  asistencia: {
    all: ['asistencia'] as const,
    list: () => [...queryKeys.asistencia.all, 'list'] as const,
  },
};
