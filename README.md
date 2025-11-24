# Sistema de Gestión de Talleres Deportivos

Aplicación web para la gestión de talleres deportivos municipales, construida con React, Vite y HeroUI.

## Tecnologías Utilizadas

- [Vite](https://vitejs.dev/guide/) - Build tool
- [HeroUI](https://heroui.com) - Componentes UI
- [Tailwind CSS](https://tailwindcss.com) - Estilos
- [TypeScript](https://www.typescriptlang.org) - Tipado
- [React Query](https://tanstack.com/query) - Gestión de estado del servidor
- [Axios](https://axios-http.com) - Cliente HTTP
- [React Router](https://reactrouter.com) - Enrutamiento

## Requisitos Previos

- Node.js 18+
- Backend PHP corriendo en `http://localhost/talleres_backend`

## Instalación

1. Clona el repositorio:
```bash
git clone <repository-url>
cd muni_talleres
```

2. Instala las dependencias:
```bash
pnpm install
```

3. Copia las variables de entorno:
```bash
cp .env.example .env
```

4. Verifica la conexión con el backend:
```bash
pnpm check-backend
```

## Verificación del Backend

Antes de ejecutar la aplicación, asegúrate de que tu backend esté funcionando correctamente:

```bash
pnpm check-backend
```

Este comando verificará que el backend esté accesible y responda correctamente a las peticiones.

## Configuración del Backend

El backend debe estar disponible en `http://localhost/talleres_backend` y exponer los siguientes endpoints:

### Talleres
- `GET /api/talleres.php?action=listar` - Lista todos los talleres
- `GET /api/talleres.php?action=detalle&id={id}` - Detalle de un taller
- `GET /api/talleres.php?action=horarios&id={id}` - Horarios de un taller
- `GET /api/talleres.php?action=alumnos&id={id}` - Alumnos inscritos en un taller
- `GET /api/talleres.php?action=clases&id={id}` - Clases de un taller

### Alumnos
- `GET /api/alumnos.php?action=listar` - Lista todos los alumnos
- `GET /api/alumnos.php?action=detalle&rut={rut}` - Detalle de un alumno

### Dashboard
- `GET /api/dashboard.php?action=stats` - Estadísticas del dashboard

## Ejecución

```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:5173`

## Estructura del Proyecto

```
src/
├── api/           # Servicios de API
├── components/    # Componentes reutilizables
├── context/       # Contextos de React
├── layouts/       # Layouts de la aplicación
├── pages/         # Páginas de la aplicación
├── types/         # Definiciones de tipos
└── utils/         # Utilidades
```

## Funcionalidades

- ✅ Dashboard con métricas y clases del día
- ✅ Gestión de talleres deportivos
- ✅ Gestión de alumnos
- ✅ Sistema de autenticación
- ✅ Diseño responsivo con HeroUI
- ✅ PWA (Progressive Web App)

## Licencia

MIT
