# React Query - Guía de Implementación

## 📦 Instalación Completada

React Query ha sido instalado y configurado en el proyecto:

```bash
npm install @tanstack/react-query
```

## 🏗️ Estructura Implementada

### 1. QueryContext (`src/contexts/QueryContext.tsx`)

Proveedor principal de React Query con configuración optimizada:
- **staleTime**: 5 minutos (datos frescos)
- **gcTime**: 10 minutos (garbage collection)
- **retry**: 1 intento en errores
- **refetchOnWindowFocus**: false (optimizado para mobile)

**Query Keys Centralizados:**
```typescript
queryKeys.talleres.list()                          // ['talleres', 'list']
queryKeys.talleres.detail(id)                      // ['talleres', 'detail', id]
queryKeys.talleres.detailWithIncludes(id, 'horarios') // ['talleres', 'detail', id, 'horarios']
```

### 2. Hooks Personalizados

#### **Talleres** (`src/hooks/useTalleresQuery.ts`)
- `useTalleres()` - Listar talleres
- `useTaller(id, include?)` - Obtener detalle
- `useCreateTaller()` - Crear
- `useUpdateTaller()` - Actualizar
- `useDeleteTaller()` - Eliminar

#### **Profesores** (`src/hooks/useProfesoresQuery.ts`)
- `useProfesores()` - Listar profesores
- `useProfesor(id, include?)` - Obtener detalle
- `useCreateProfesor()` - Crear
- `useUpdateProfesor()` - Actualizar
- `useDeleteProfesor()` - Eliminar

#### **Alumnos** (`src/hooks/useAlumnosQuery.ts`)
- `useAlumnos()` - Listar alumnos
- `useAlumno(id, include?)` - Obtener detalle
- `useCreateAlumno()` - Crear
- `useUpdateAlumno()` - Actualizar
- `useDeleteAlumno()` - Eliminar

#### **Horarios** (`src/hooks/useHorariosQuery.ts`)
- `useHorarios()` - Listar horarios
- `useCreateHorario()` - Crear
- `useUpdateHorario()` - Actualizar
- `useDeleteHorario()` - Eliminar

## 🚀 Uso Recomendado

### Ejemplo: Refactorizar una página para usar React Query

**Antes (sin React Query):**
```typescript
export default function TalleresIndex() {
  const [talleres, setTalleres] = useState<Taller[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarTalleres = async () => {
    try {
      const data = await talleresApi.listar();
      setTalleres(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTalleres();
  }, []);

  // ... rest of component
}
```

**Después (con React Query):**
```typescript
import { useTalleres, useDeleteTaller } from '../../src/hooks/useTalleresQuery';

export default function TalleresIndex() {
  const { data: talleres = [], isLoading, refetch } = useTalleres();
  const deleteMutation = useDeleteTaller();

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync(id);
    // La lista se refresca automáticamente
  };

  // ... rest of component
}
```

### Ventajas:
- ✅ **Menos código**: No más useState/useEffect boilerplate
- ✅ **Caching automático**: Datos compartidos entre componentes
- ✅ **Refetch inteligente**: Revalidación automática
- ✅ **Loading/Error states**: Manejados por React Query
- ✅ **Invalidación automática**: Mutations actualizan queries relacionadas
- ✅ **Optimistic updates**: Actualizaciones instantáneas en UI

## 📝 Página de Detalle con React Query

**Ejemplo: Taller Detail con includes**
```typescript
import { useTaller, useUpdateTaller } from '../../src/hooks/useTalleresQuery';

export default function TallerDetail() {
  const { id } = useLocalSearchParams();
  const { data: taller, isLoading, refetch } = useTaller(
    Number(id), 
    'horarios,alumnos,profesores,estadisticas'
  );
  const updateMutation = useUpdateTaller();

  const handleUpdate = async (data: Partial<Taller>) => {
    await updateMutation.mutateAsync({ id: Number(id), data });
    // Automáticamente refresca el detalle y la lista
  };

  if (isLoading) return <ActivityIndicator />;
  if (!taller) return <Text>No encontrado</Text>;

  return (
    <ScrollView refreshControl={
      <RefreshControl refreshing={isLoading} onRefresh={refetch} />
    }>
      {/* ... contenido */}
    </ScrollView>
  );
}
```

## 🔄 Invalidación Manual de Queries

Si necesitas forzar un refetch:

```typescript
import { invalidateQueries, queryKeys } from '../contexts/QueryContext';

// Invalidar todos los talleres
invalidateQueries(queryKeys.talleres.all);

// Invalidar un taller específico
invalidateQueries(queryKeys.talleres.detail(5));
```

## ⚠️ Notas Importantes

1. **QueryProvider ya está integrado** en `app/_layout.tsx` - No necesitas agregarlo de nuevo
2. Los hooks están listos para usar pero las páginas actuales **aún no los implementan** para mantener compatibilidad
3. Para migrar una página, simplemente reemplaza el patrón useState/useEffect con los hooks correspondientes
4. Los toasts de éxito/error se manejan automáticamente en las mutaciones

## 🎯 Próximos Pasos Sugeridos

1. Refactorizar páginas de índice (talleres, profesores, alumnos) para usar `useX()` hooks
2. Refactorizar páginas de detalle para usar `useX(id, include)` hooks
3. Refactorizar formularios de creación/edición para usar mutation hooks
4. Considerar agregar optimistic updates para mejor UX

## 📚 Recursos

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [React Query DevTools](https://tanstack.com/query/latest/docs/framework/react/devtools) (opcional para debugging)
