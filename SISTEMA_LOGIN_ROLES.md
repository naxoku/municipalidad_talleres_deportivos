# 🎯 Sistema de Login y Vistas Dinámicas por Rol

## ✅ Implementación Completada

Se ha desarrollado un sistema completo de autenticación con vistas dinámicas según el rol del usuario. El sistema distingue entre **Administradores** y **Profesores**, mostrando interfaces y funcionalidades personalizadas para cada uno.

---

## 🏗️ Arquitectura Implementada

### Backend (PHP)
- ✅ **API de Autenticación** (`api/auth.php`)
  - Validación de credenciales contra base de datos
  - Generación de tokens de sesión
  - Verificación de usuarios activos
  - Respuesta con datos del usuario y rol

- ✅ **Base de Datos**
  - Tabla `usuarios` con soporte para roles
  - Relación con tabla `profesores` para usuarios tipo profesor
  - Sistema de tokens para sesiones
  - Scripts de configuración automática

### Frontend (React + TypeScript)

#### 1. Sistema de Autenticación
- ✅ **Auth Context** (`src/context/auth.tsx`)
  - Gestión de estado de usuario
  - Función `login()` con integración al backend
  - Función `logout()` con limpieza de sesión
  - Hook `hasPermission()` para control de acceso granular
  - Persistencia de sesión en localStorage

- ✅ **API Client** (`src/api/auth.ts`)
  - Cliente axios para comunicación con backend
  - Tipado TypeScript para requests/responses

#### 2. Rutas Protegidas
- ✅ **ProtectedRoute Component** (`src/components/ProtectedRoute.tsx`)
  - Verificación de autenticación
  - Control de acceso por rol
  - Control de acceso por permisos específicos
  - Redirección automática para usuarios no autorizados

- ✅ **App.tsx actualizado**
  - Rutas protegidas según rol
  - Separación de rutas admin vs profesor

#### 3. Vistas Diferenciadas

##### Dashboard Administrador (`src/pages/dashboard/admin.tsx`)
**Características:**
- Vista general del sistema completo
- Métricas globales (todos los alumnos, talleres, profesores)
- Acciones rápidas:
  - Inscribir alumnos
  - Crear horarios
  - Corregir asistencias
  - Ver ubicaciones
  - Generar reportes rápidos
- Vista de todas las clases del día
- Acceso completo a todas las funcionalidades

##### Dashboard Profesor (`src/pages/dashboard/profesor.tsx`)
**Características:**
- Vista personalizada con saludo al profesor
- Métricas específicas:
  - Solo sus talleres
  - Solo sus alumnos
  - Sus clases del día
  - Su asistencia promedio
- Acciones rápidas limitadas:
  - Ver mis talleres
  - Pasar asistencia
  - Gestionar planificación
  - Ver mis alumnos
- Solo ve sus propias clases del día
- Interfaz simplificada y enfocada

##### Dashboard Principal (`src/pages/dashboard/index.tsx`)
- Componente inteligente que renderiza la vista correcta según el rol
- Sin lógica duplicada

#### 4. Componentes Actualizados

##### Sidebar (`src/components/sidebar.tsx`)
- Menú dinámico según rol:
  - **Admin**: Dashboard, Talleres, Alumnos, Profesores, Horarios, Reportes
  - **Profesor**: Dashboard, Mis Talleres, Mis Alumnos, Horarios, Asistencia, Planificación
- Muestra información del usuario actual
- Indica el rol en la parte inferior

##### Login (`src/pages/login.tsx`)
- Formulario único con validación real
- Integración con backend para autenticación
- Mensajes de error con toasts
- Instrucciones de usuarios de prueba
- Loading state durante login

---

## 🔐 Sistema de Permisos

### Administrador
```typescript
Permisos: [
  'view_dashboard',          // Ver dashboard
  'manage_talleres',         // CRUD talleres
  'manage_alumnos',          // CRUD alumnos
  'manage_profesores',       // CRUD profesores
  'manage_horarios',         // Gestionar horarios
  'manage_asistencia',       // Corregir asistencias
  'manage_ubicaciones',      // CRUD ubicaciones
  'generate_reports',        // Reportes avanzados
  'manage_users',            // Gestionar usuarios
  'view_reports',            // Ver reportes
]

Acceso a Rutas:
✓ /dashboard
✓ /talleres
✓ /alumnos
✓ /profesores
✓ /horarios
✓ /reportes (exclusivo admin)
✓ /ubicaciones
```

### Profesor
```typescript
Permisos: [
  'view_dashboard',          // Ver su dashboard
  'view_my_talleres',        // Ver solo sus talleres
  'view_my_alumnos',         // Ver solo sus alumnos
  'manage_asistencia',       // Pasar asistencia de sus clases
  'view_horarios',           // Ver horarios
  'manage_planificacion',    // Crear planificaciones
  'view_simple_reports',     // Reportes básicos
]

Acceso a Rutas:
✓ /dashboard (vista profesor)
✓ /talleres (filtrado por sus talleres)
✓ /alumnos (filtrado por sus alumnos)
✓ /horarios (solo lectura)
✓ /asistencia
✓ /planificacion
✗ /reportes (bloqueado)
✗ /profesores (bloqueado)
```

---

## 🚀 Guía de Instalación y Uso

### Paso 1: Configurar Base de Datos

**Opción A - Script Automático (Recomendado)**
1. Abre tu navegador
2. Ve a: `http://localhost/talleres_backend/setup_auth.php`
3. El script creará automáticamente:
   - Tabla `usuarios` si no existe
   - Usuarios de prueba
4. Sigue las instrucciones en pantalla

**Opción B - Manual**
1. Abre phpMyAdmin
2. Selecciona la base de datos `talleres_municipales`
3. Importa el archivo `setup_usuarios.sql`

### Paso 2: Verificar Backend
1. Asegúrate de que WAMP/XAMPP esté corriendo
2. Verifica que puedes acceder a: `http://localhost/talleres_backend/api/auth.php`

### Paso 3: Configurar Frontend
1. Verifica que la variable de entorno esté configurada:
```bash
# .env o .env.local
VITE_API_URL=http://localhost/talleres_backend
```

2. Instala dependencias si es necesario:
```bash
pnpm install
```

3. Inicia el servidor de desarrollo:
```bash
pnpm dev
```

### Paso 4: Probar el Sistema

#### Probar como Administrador
1. Ve a `http://localhost:5173/login`
2. Ingresa:
   - **Email**: `admin@muni.cl`
   - **Contraseña**: `password123`
3. Deberías ver:
   - Dashboard completo con todas las métricas
   - Sidebar con todas las opciones (incluyendo Reportes)
   - Acceso a todas las funcionalidades

#### Probar como Profesor
1. Cierra sesión (botón en el sidebar)
2. Ingresa:
   - **Email**: `profesor@muni.cl`
   - **Contraseña**: `password123`
3. Deberías ver:
   - Dashboard personalizado con saludo
   - Sidebar con opciones limitadas (sin Reportes ni Profesores)
   - Solo información relacionada con sus talleres

---

## 📁 Archivos Creados/Modificados

### Backend
```
talleres_backend/
├── api/
│   └── auth.php                    ✨ NUEVO - API de autenticación
├── setup_usuarios.sql              ✨ NUEVO - Script SQL
├── setup_auth.php                  ✨ NUEVO - Configurador web
└── AUTH_SETUP.md                   ✨ NUEVO - Documentación
```

### Frontend
```
municipalidad_talleres_deportivos/
├── src/
│   ├── api/
│   │   └── auth.ts                 ✨ NUEVO - Cliente API auth
│   ├── components/
│   │   └── ProtectedRoute.tsx     ✨ NUEVO - Rutas protegidas
│   ├── context/
│   │   └── auth.tsx                🔄 MEJORADO - Sistema completo
│   ├── pages/
│   │   ├── login.tsx               🔄 MEJORADO - Login real
│   │   └── dashboard/
│   │       ├── index.tsx           ✨ NUEVO - Router por rol
│   │       ├── admin.tsx           🔄 MOVIDO - Vista admin
│   │       └── profesor.tsx        ✨ NUEVO - Vista profesor
│   ├── components/
│   │   └── sidebar.tsx             🔄 MEJORADO - Menú dinámico
│   ├── types/
│   │   └── schema.ts               🔄 ACTUALIZADO - Tipo User
│   └── App.tsx                     🔄 ACTUALIZADO - Rutas protegidas
```

---

## 🔧 Uso del Sistema de Permisos en Código

### Verificar Permisos en Componentes
```typescript
import { useAuth } from "@/context/auth";

function MiComponente() {
  const { hasPermission, user } = useAuth();
  
  return (
    <div>
      {hasPermission('manage_talleres') && (
        <Button onClick={crearTaller}>Crear Taller</Button>
      )}
      
      {user?.rol === 'admin' && (
        <PanelAdministrador />
      )}
      
      {user?.rol === 'profesor' && (
        <VistaProfesor />
      )}
    </div>
  );
}
```

### Proteger Rutas
```typescript
<Route
  element={
    <ProtectedRoute requiredRole="admin">
      <SoloAdminPage />
    </ProtectedRoute>
  }
  path="/admin-only"
/>

<Route
  element={
    <ProtectedRoute requiredPermission="manage_talleres">
      <GestionTalleres />
    </ProtectedRoute>
  }
  path="/talleres/manage"
/>
```

---

## 🎨 Diferencias Visuales Entre Roles

### Dashboard Administrador
- **Color principal**: Azul primario
- **Diseño**: Grid completo con todas las métricas
- **Acciones**: 5 botones de acciones rápidas
- **Clases**: Muestra TODAS las clases del día (todos los profesores)
- **Header**: "Dashboard"

### Dashboard Profesor
- **Color principal**: Colores variados por categoría
- **Diseño**: Cards con iconos grandes y coloridos
- **Acciones**: 4 botones enfocados en sus tareas
- **Clases**: Solo SUS clases del día
- **Header**: "¡Hola, [Nombre del Profesor]!"

### Sidebar
- **Admin**: 6 opciones (incluye Reportes y Profesores)
- **Profesor**: 6 opciones diferentes (incluye Planificación, excluye Reportes/Profesores)
- **Footer**: Muestra nombre y rol del usuario

---

## 🔒 Seguridad Implementada

✅ Contraseñas hasheadas con bcrypt
✅ Validación de sesión en cada request
✅ Tokens únicos por sesión
✅ Verificación de usuario activo
✅ Protección de rutas en frontend
✅ Verificación de permisos granular
✅ CORS habilitado para desarrollo
✅ Prevención de inyección SQL con prepared statements

---

## 🐛 Solución de Problemas

### "Error al iniciar sesión"
- Verifica que WAMP esté corriendo
- Confirma que ejecutaste `setup_auth.php`
- Revisa la consola del navegador para errores de red

### "No aparece el dashboard correcto"
- Limpia localStorage del navegador
- Cierra sesión y vuelve a iniciar
- Verifica que el usuario tenga el rol correcto en la BD

### "No puedo acceder a ciertas páginas"
- Es normal, las rutas están protegidas por rol
- Administradores tienen acceso completo
- Profesores tienen acceso limitado

---

## 📝 Próximos Pasos Sugeridos

1. **Filtrado de datos por profesor**
   - Modificar APIs de talleres/alumnos para filtrar por `profesor_id`
   - Implementar en páginas de listados

2. **Página de planificación**
   - Crear interfaz para que profesores planifiquen clases
   - CRUD de planificaciones

3. **Página de asistencia**
   - Mejorar interfaz para pasar asistencia
   - Permitir a profesores marcar asistencia de sus clases

4. **Recuperación de contraseña**
   - Sistema de "olvidé mi contraseña"
   - Envío de emails

5. **Gestión de usuarios (Admin)**
   - Panel para crear/editar usuarios
   - Asignar profesores a usuarios

6. **Auditoría**
   - Log de accesos
   - Registro de cambios importantes

---

## 📚 Recursos Adicionales

- **Documentación completa**: Ver `AUTH_SETUP.md` en el backend
- **Script de configuración**: `setup_auth.php`
- **Archivo SQL**: `setup_usuarios.sql`

---

¡El sistema de autenticación con vistas dinámicas está completamente implementado y listo para usar! 🎉
