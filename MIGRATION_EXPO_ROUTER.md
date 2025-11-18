**Resumen**
- **Objetivo:** Migrar la aplicación de React Navigation tradicional a Expo Router, convertir modales en rutas (rutas modal) y mantener soporte web (URLs) y móvil.
- **Enfoque:** Migración incremental y por fases, primero añadir `expo-router` entry y layouts, luego refactorizar llamadas `navigation.*` a `useRouter()` por lotes pequeños.

**Plan de migración (fases)**
1. Preparación
   - Añadir `expo-router` entry en `index.js`.
   - Crear `app/_layout.tsx` con providers globales (`AuthProvider`, `ToastProvider`).
   - Añadir layout global que renderice `<Slot />`.
2. Rutas iniciales y modales
   - Crear wrappers para pantallas principales bajo `app/` (p. ej. `/dashboard`, `/talleres`).
   - Crear carpeta de modales `app/(modals)/` y mover los modales como páginas (por ejemplo `nuevo-alumno`, `nuevo-taller`, `nueva-inscripcion`, `exportar`).
3. Drawer / Layout principal
   - Reproducir la experiencia del Drawer de React Navigation dentro de un layout de Expo Router (sidebar permanente en web/desktop y modal drawer en móvil).
4. Refactor de API de navegación (Opción A)
   - Buscar y refactorizar todas las llamadas `navigation.navigate`, `navigation.goBack`, `useNavigation` a `useRouter()` + `router.push()/router.back()/router.replace()` en pequeños PRs.
5. Consolidación y limpieza
   - Quitar wrappers duplicados, eliminar `react-navigation` si la app funciona completamente con Expo Router.
   - Actualizar `README` e instrucciones de instalación.
6. Pruebas y ajustes finales
   - Probar en web, Android (dev-client) e iOS.
   - Validar deep links, comportamiento de back y URLs públicas.

**Qué se ha hecho (resumen de cambios aplicados)**
- Entry point
  - `index.js` modificado para usar `expo-router/entry`.
- Layout y providers
  - `app/_layout.tsx` creado y ahora envuelve la app con `AuthProvider` y `ToastProvider`.
  - Se añadió `src/components/DrawerLayout.tsx` (sidebar / topbar reutilizable) y se integró en `app/_layout.tsx`.
- Rutas y wrappers
  - Se crearon rutas y wrappers iniciales (grupo Drawer): `app/(drawer)/dashboard.tsx`, `app/(drawer)/talleres.tsx`, `app/(drawer)/profesores.tsx`, `app/(drawer)/alumnos.tsx`, `app/(drawer)/clases.tsx`, `app/(drawer)/horarios.tsx`, `app/(drawer)/inscripciones.tsx`, `app/(drawer)/asistencia.tsx`, `app/(drawer)/reportes.tsx`.
  - Se añadieron wrappers `app/*` iniciales y posteriormente se inició la consolidación hacia `app/(drawer)/`.
- Modales como rutas
  - `app/(modals)/` contiene páginas modal (ejemplos: `nuevo-alumno`, `nuevo-taller`, `nueva-inscripcion`, `exportar`).
- Refactor parcial de navegación
  - `src/screens/DashboardScreen.tsx`: refactor para abrir modales con `router.push('/(modals)/...')` y sustitución de `navigation.navigate` en varios puntos críticos.
  - `src/screens/TalleresScreen.tsx`: añadido `useRouter()` y reemplazadas llamadas `navigation.navigate(...)` por `router.push('/alumnos?tallerId=...')` / `router.push('/clases?tallerId=...')`.
  - `src/components/GlobalSearch.tsx`: se cambió para usar `useRouter()` y `router.push()` en la selección de resultados.
  - `src/screens/AlumnosEnhancedScreen.tsx`: removida la prop `navigation`, añadido `useRouter()` y apertura de modales con `router.push()`.

**Archivos importantes añadidos/actualizados**
- Añadidos
  - `app/(drawer)/dashboard.tsx`, `app/(drawer)/talleres.tsx`, `app/(drawer)/profesores.tsx`, `app/(drawer)/alumnos.tsx`, `app/(drawer)/clases.tsx`, `app/(drawer)/horarios.tsx`, `app/(drawer)/inscripciones.tsx`, `app/(drawer)/asistencia.tsx`, `app/(drawer)/reportes.tsx`
  - `app/(modals)/nuevo-alumno.tsx`, `app/(modals)/nuevo-taller.tsx`, `app/(modals)/nueva-inscripcion.tsx`, `app/(modals)/exportar.tsx`
  - `src/components/DrawerLayout.tsx`
- Modificados
  - `app/_layout.tsx` (ahora envuelve `<Slot />` con `DrawerLayout`)
  - `src/screens/DashboardScreen.tsx`, `src/screens/TalleresScreen.tsx`, `src/components/GlobalSearch.tsx`, `src/screens/AlumnosEnhancedScreen.tsx`

**Qué falta por hacer (pendientes)**
- Crear branch de trabajo `migrate/expo-router` (no creado en el repo; hacerlo localmente antes de commits importantes).
- Completar el refactor global de llamadas de navegación (queda código por revisar en `src/` y componentes). Plan: hacerlo por lotes pequeños (2–3 pantallas por PR).
- Consolidar y limpiar wrappers duplicados en `app/` (el objetivo es que las rutas vivan bajo el layout del Drawer: `app/(drawer)/...`).
- Actualizar `README.md` con instrucciones de instalación y los comandos necesarios para el equipo.
- Ejecutar pruebas en web y en dispositivos móviles; comprobar deep links y comportamiento de back.
- Quitar `react-navigation` de `package.json` y deps cuando la migración esté totalmente probada.

**Pruebas locales (comandos)**
- Levantar Expo (limpiando cache):

  ```powershell
  npx expo start --clear
  ```

- Rutas a probar en web (dev):
  - `http://localhost:19006/dashboard`
  - `http://localhost:19006/talleres`
  - `http://localhost:19006/alumnos`
  - Probar modales (ejemplo): `http://localhost:19006/(modals)/nuevo-alumno`

**Checklist de verificación rápida**
- [ ] Las rutas principales cargan sin errores (Dashboard, Talleres, Alumnos, Horarios).
- [ ] Los modales abren como rutas y cierran con `router.back()` o usando la UI de cierre.
- [ ] El buscador global apunta correctamente a las rutas (alumnos/profesores/talleres) con `router.push()`.
- [ ] La navegación "Back" funciona en web (history) y en móvil (hardware back / swipe).
- [ ] No hay errores en consola relacionados con "Couldn't find any screens for the navigator".

**Riesgos y notas**
- Algunas llamadas a `navigation` pueden ocurrir en utilidades fuera de componentes o en refs; estas requieren adaptaciones por caso (p. ej. crear un `RouterService` o pasar `router` como prop).
- Quitar `react-navigation` debe posponerse hasta completar y probar toda la app.
- Recomiendo PRs pequeños y verificables (2–3 pantallas por PR) para facilitar revisión y revertir si algo falla.

**Próximo paso sugerido (si no hay objeciones)**
- Consolidar wrappers en `app/(drawer)/` (eliminar duplicados de `app/`) y terminar Lote 2 del refactor (convertir `ReportesScreen` y cualquier pantalla con `navigation` restante). Puedo aplicar esos cambios si confirmas.

---
Generado el: 18 de noviembre de 2025
