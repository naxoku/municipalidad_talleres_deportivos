# 📱 Aplicación Talleres Deportivos - Municipalidad de Angol

Sistema de gestión de talleres deportivos desarrollado con **React Native + Expo** para móvil, tablet y web.

## 🎨 Sistema de Diseño

### Colores Corporativos
- **Verde Muni**: `#00862d` - Color principal de la Municipalidad de Angol
- **Azul Deportes**: `#1e88e5` - Del logo de la Unidad de Deportes
- **Estilo**: Minimalista con toques coloridos

Ver documentación completa en [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md)

## 🚀 Inicio Rápido

### Configurar Backend URL

Edita `src/api/config.ts`:
```typescript
export const API_URL = 'http://localhost/talleres_backend';
```

### Instalar y Ejecutar

```bash
npm install
npm run web      # Para web
npm run android  # Para Android
npm start        # Para desarrollo
```

## 🗂️ Estructura del Proyecto

```
municipalidad_talleres_deportivos/
├── src/
│   ├── api/              # Servicios de API
│   ├── components/       # Componentes reutilizables
│   ├── contexts/         # Contextos de React
│   ├── navigation/       # Configuración de navegación
│   ├── screens/          # Pantallas de la app
│   ├── theme/            # Sistema de diseño
│   └── types/            # Tipos TypeScript
├── DESIGN_SYSTEM.md      # Documentación del diseño
└── README.md             # Este archivo
```

## 📡 Rutas API y Endpoints

### Configuración Base
**Archivo**: `src/api/config.ts`
```typescript
export const API_URL = 'http://localhost/talleres_backend';
```

### 👨‍🏫 Profesores
**Archivo**: `src/api/profesores.ts`  
**Ruta Base**: `/api/profesores.php`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `?accion=listar` | Listar todos los profesores |
| POST | `?accion=crear` | Crear nuevo profesor |
| PUT | `?accion=actualizar` | Actualizar profesor existente |
| DELETE | `?accion=eliminar` | Eliminar profesor |

**Pantalla**: `ProfesoresScreen.tsx`  
**Campos**: nombre, especialidad, email, contraseña (solo crear)

---

### 👨‍🎓 Estudiantes
**Archivo**: `src/api/estudiantes.ts`  
**Ruta Base**: `/api/estudiantes.php`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `?accion=listar` | Listar todos los estudiantes |
| POST | `?accion=crear` | Crear nuevo estudiante |
| PUT | `?accion=actualizar` | Actualizar estudiante |
| DELETE | `?accion=eliminar` | Eliminar estudiante |

**Pantalla**: `EstudiantesScreen.tsx`  
**Campos**: nombre, fecha_nacimiento, contacto

---

### 📚 Talleres
**Archivo**: `src/api/talleres.ts`  
**Ruta Base**: `/api/talleres.php`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `?accion=listar` | Listar todos los talleres |
| POST | `?accion=crear` | Crear nuevo taller |
| PUT | `?accion=actualizar` | Actualizar taller |
| DELETE | `?accion=eliminar` | Eliminar taller |

**Pantalla**: `TalleresScreen.tsx`  
**Campos**: nombre, descripción, profesor_id  
**Relación**: Con Profesores (FK)

---

### 🕐 Horarios
**Archivo**: `src/api/horarios.ts`  
**Ruta Base**: `/api/horarios.php`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `?accion=listar` | Listar todos los horarios |
| POST | `?accion=crear` | Crear nuevo horario |
| DELETE | `?accion=eliminar` | Eliminar horario |

**Pantalla**: `HorariosScreen.tsx`  
**Campos**: taller_id, dia_semana, hora_inicio, hora_fin  
**Relación**: Con Talleres (FK)

---

### ✅ Inscripciones
**Archivo**: `src/api/inscripciones.ts`  
**Ruta Base**: `/api/inscripciones.php`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `?accion=listar` | Listar todas las inscripciones |
| POST | `?accion=crear` | Inscribir estudiante a taller |
| DELETE | `?accion=eliminar` | Eliminar inscripción |

**Pantalla**: `InscripcionesScreen.tsx`  
**Campos**: estudiante_id, taller_id, fecha_inscripcion  
**Relaciones**: Con Estudiantes y Talleres (FK)

---

### 📅 Clases
**Archivo**: `src/api/clases.ts`  
**Ruta Base**: `/api/clases.php`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `?accion=listar` | Listar todas las clases |
| POST | `?accion=crear` | Crear nueva clase |
| DELETE | `?accion=eliminar` | Eliminar clase |

**Pantalla**: `ClasesScreen.tsx`  
**Campos**: taller_id, fecha, hora_inicio, hora_fin  
**Relación**: Con Talleres (FK)

---

### 📍 Asistencia
**Archivo**: `src/api/asistencia.ts`  
**Ruta Base**: `/api/asistencia.php`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `?accion=obtener&clase_id=X` | Obtener asistencia de una clase |
| POST | `?accion=marcar` | Marcar/actualizar asistencia |

**Pantalla**: `AsistenciaScreen.tsx`  
**Campos**: clase_id, estudiante_id, presente  
**Relaciones**: Con Clases y Estudiantes (FK)

---

### 🎽 Indumentaria
**Archivo**: `src/api/indumentaria.ts`  
**Ruta Base**: `/api/indumentaria.php` y `/api/indumentaria_taller.php`

#### Indumentaria
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `?accion=listar` | Listar indumentaria |
| POST | `?accion=crear` | Crear indumentaria |
| PUT | `?accion=actualizar` | Actualizar indumentaria |
| DELETE | `?accion=eliminar` | Eliminar indumentaria |

#### Asignaciones (Indumentaria ↔ Taller)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `?accion=listar` | Listar asignaciones |
| POST | `?accion=asignar` | Asignar a taller |
| DELETE | `?accion=desasignar` | Desasignar de taller |

**Pantalla**: `IndumentariaScreen.tsx` (con tabs)  
**Campos**: nombre, descripción, cantidad  
**Relación**: Con Talleres (muchos a muchos)

---

## 🧩 Componentes Reutilizables

### Button
**Archivo**: `src/components/Button.tsx`
```typescript
<Button 
  title="Guardar" 
  variant="primary"  // primary, secondary, success, danger, outline
  onPress={handleSave}
  loading={isLoading}
/>
```

### Input
**Archivo**: `src/components/Input.tsx`
```typescript
<Input
  label="Nombre"
  required
  value={nombre}
  onChangeText={setNombre}
  placeholder="Ingrese nombre"
/>
```

### Table
**Archivo**: `src/components/Table.tsx`  
Usado en vista web/desktop para mostrar datos tabulares.

### EmptyState
**Archivo**: `src/components/EmptyState.tsx`
```typescript
<EmptyState message="No hay datos disponibles" />
```

---

## 🎨 Sistema de Colores

### Paleta Principal
```typescript
// src/theme/colors.ts
colors = {
  primary: '#00862d',        // Verde Muni
  blue: {
    main: '#1e88e5',         // Azul Deportes
    soft: '#e3f2fd',         // Azul suave (fondos)
  },
  success: '#00862d',
  error: '#e53935',
  warning: '#ff9800',
}
```

### Uso en Pantallas
- **Drawer Navigation**: Fondo verde `#00862d`
- **Botón Principal**: Verde `#00862d`
- **Botón Secundario**: Azul `#1e88e5`
- **Tabs Activos**: Verde `#00862d`
- **Bordes de Tarjetas**: Azul, morado, naranja (variantes)

Ver [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) para detalles completos.

---

## 📱 Características

- ✅ **Drawer Navigation** con menú lateral
- ✅ **8 Pantallas completas** con CRUD
- ✅ **Diseño responsive** (móvil, tablet, web)
- ✅ **Safe Areas** para notch y barras
- ✅ **Modales** deslizables
- ✅ **Estados de carga** y confirmaciones
- ✅ **Diseño minimalista** con colores corporativos

## 🛠️ Stack Tecnológico

- **React Native** 0.81.5 + **Expo** ~54.0
- **TypeScript** ~5.9
- **React Navigation** 7.x (Drawer)
- **Safe Area Context**
- **Fetch API** para HTTP

## 📝 Convenciones de Código

### Estructura de Servicios API
Todos los archivos en `src/api/` siguen este patrón:

```typescript
import { API_URL } from './config';

export const moduloApi = {
  listar: async () => { /* GET */ },
  crear: async (data) => { /* POST */ },
  actualizar: async (data) => { /* PUT */ },
  eliminar: async (id) => { /* DELETE */ },
};
```

### Estructura de Pantallas
Todas las pantallas siguen este patrón:

```typescript
// 1. Imports
import { sharedStyles } from '../theme/sharedStyles';

// 2. Estados
const [datos, setDatos] = useState([]);
const [loading, setLoading] = useState(false);

// 3. Efectos
useEffect(() => { cargarDatos(); }, []);

// 4. Funciones
const cargarDatos = async () => { /* ... */ };

// 5. Render
return (
  <View style={sharedStyles.container}>
    {/* Header */}
    {/* Lista/Tabla */}
    {/* Modal */}
  </View>
);
```

### Estilos Compartidos
Usa `sharedStyles` de `src/theme/sharedStyles.ts`:

```typescript
import { sharedStyles } from '../theme/sharedStyles';

<View style={sharedStyles.card}>
  <Text style={sharedStyles.cardTitle}>Título</Text>
  <Text style={sharedStyles.cardDetail}>Detalle</Text>
</View>
```

## 🐛 Troubleshooting

### Backend no conecta
1. Verifica WAMP esté corriendo
2. Revisa URL en `src/api/config.ts`
3. Móvil: usa IP de tu PC, no `localhost`
4. Verifica firewall

### Reiniciar cache
```bash
npm start -- --reset-cache
```

### TypeScript errors
VS Code: `Ctrl+Shift+P` > "TypeScript: Restart TS Server"

## 📱 Testing

- **Android/iOS**: Expo Go + QR code (misma WiFi)
- **Web**: `http://localhost:8081`

## 📚 Documentación Adicional

- [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) - Sistema de colores y componentes
- [`ACTUALIZACION_DISENO.md`](./ACTUALIZACION_DISENO.md) - Cambios de diseño
- [`CONFIGURACION_APP.md`](./CONFIGURACION_APP.md) - Guía técnica completa

## 📄 Licencia

Municipalidad de Angol - Unidad de Deportes © 2025

---

**Desarrollado con** ❤️ **usando React Native + Expo**
