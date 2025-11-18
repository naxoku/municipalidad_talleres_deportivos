# 📱 Talleres Deportivos - Municipalidad de Angol

Sistema de gestión de talleres deportivos desarrollado con **React Native + Expo** para móvil, tablet y web.

## 🎨 Características Principales

- ✅ **Navegación por Drawer** con menú lateral responsivo
- ✅ **9 secciones principales** con operaciones CRUD completas
- ✅ **Diseño responsive** (móvil, tablet, web)
- ✅ **Modales deslizables** para formularios
- ✅ **Estados de carga** y confirmaciones
- ✅ **Sistema de autenticación** por roles (Admin/Profesor/Alumno)
- ✅ **Búsqueda global** integrada

## 🚀 Inicio Rápido

### Configurar Backend URL

Edita `src/api/config.ts`:
```typescript
export const API_URL = 'http://localhost/talleres_backend';
```

### Instalar y Ejecutar

```bash
npm install
npx expo start --clear    # Para desarrollo
npm run web              # Para web
npm run android          # Para Android
```

## 🗺️ Rutas de la Aplicación

### Rutas Principales
| Ruta | Descripción | Acceso |
|------|-------------|--------|
| `/` | Dashboard principal | Todos |
| `/talleres` | Gestión de talleres | Admin/Profesor |
| `/profesores` | Gestión de profesores | Admin |
| `/alumnos` | Gestión de alumnos | Admin/Profesor |
| `/horarios` | Gestión de horarios | Admin/Profesor |
| `/inscripciones` | Gestión de inscripciones | Admin |
| `/asistencia` | Control de asistencia | Admin/Profesor |
| `/reportes` | Reportes y estadísticas | Admin |
| `/clases` | Gestión de clases programadas | Admin |

### Rutas Modales
Los modales se muestran localmente sin cambiar la URL de navegación.

## 📡 API Endpoints

### Configuración Base
**URL Base**: `http://localhost/talleres_backend/api/`

### 👨‍🏫 Profesores
**Endpoint**: `profesores.php`
- `GET ?accion=listar` - Listar profesores
- `POST ?accion=crear` - Crear profesor
- `PUT ?accion=actualizar` - Actualizar profesor
- `DELETE ?accion=eliminar` - Eliminar profesor

### 👨‍🎓 Alumnos
**Endpoint**: `alumnos.php`
- `GET ?accion=listar` - Listar alumnos
- `POST ?accion=crear` - Crear alumno
- `PUT ?accion=actualizar` - Actualizar alumno
- `DELETE ?accion=eliminar` - Eliminar alumno

### 📚 Talleres
**Endpoint**: `talleres.php`
- `GET ?accion=listar` - Listar talleres
- `POST ?accion=crear` - Crear taller
- `PUT ?accion=actualizar` - Actualizar taller
- `DELETE ?accion=eliminar` - Eliminar taller

### 🕐 Horarios
**Endpoint**: `horarios.php`
- `GET ?accion=listar` - Listar horarios
- `POST ?accion=crear` - Crear horario
- `DELETE ?accion=eliminar` - Eliminar horario

### ✅ Inscripciones
**Endpoint**: `inscripciones.php`
- `GET ?accion=listar` - Listar inscripciones
- `POST ?accion=crear` - Crear inscripción
- `DELETE ?accion=eliminar` - Eliminar inscripción

### 📅 Clases
**Endpoint**: `clases.php`
- `GET ?accion=listar` - Listar clases
- `POST ?accion=crear` - Crear clase
- `DELETE ?accion=eliminar` - Eliminar clase

### 📍 Asistencia
**Endpoint**: `asistencia.php`
- `GET ?accion=obtener&clase_id=X` - Obtener asistencia
- `POST ?accion=marcar` - Marcar asistencia

### 📊 Dashboard
**Endpoint**: `dashboard.php`
- `GET` - Datos del dashboard

### 📈 Reportes
**Endpoint**: `reportes.php`
- `GET ?accion=estadisticas&period=X` - Estadísticas
- `GET ?accion=exportar_X&period=X` - Exportar reportes

## 🛠️ Stack Tecnológico

- **React Native** 0.81.5 + **Expo** ~54.0
- **Expo Router** (navegación basada en archivos)
- **TypeScript** ~5.9
- **React Navigation** (integrado con Expo Router)

## 📱 Testing

- **Web**: `http://localhost:8081`
- **Android/iOS**: Expo Go + QR code (misma red WiFi)
- **Móvil**: Usar IP de la PC, no `localhost`

## 🐛 Troubleshooting

### Backend no conecta
1. Verificar que WAMP esté ejecutándose
2. Revisar URL en `src/api/config.ts`
3. Para móvil: usar IP de la PC (ej: `http://192.168.1.100/talleres_backend`)
4. Verificar firewall/antivirus

### Limpiar caché
```bash
npx expo start --clear
```

### Errores de TypeScript
En VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

## 📁 Estructura del Proyecto

```
municipalidad_talleres_deportivos/
├── app/                    # Rutas de Expo Router
│   ├── (drawer)/          # Layout con drawer
│   ├── (modals)/          # Rutas modales
│   ├── _layout.tsx        # Layout raíz
│   └── [ruta].tsx         # Páginas principales
├── src/
│   ├── api/               # Servicios API
│   ├── components/        # Componentes reutilizables
│   ├── contexts/          # Contextos React
│   ├── hooks/             # Hooks personalizados
│   ├── screens/           # Pantallas (componentes)
│   ├── theme/             # Sistema de diseño
│   └── types/             # Tipos TypeScript
└── talleres_backend/      # Backend PHP
```

## 📄 Licencia

Municipalidad de Angol - Unidad de Deportes © 2025

---

**Desarrollado con** ❤️ **usando React Native + Expo**
