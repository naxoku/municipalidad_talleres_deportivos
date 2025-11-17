# Notas pendientes y problemas detectados

Documento conciso con lo que no funciona o falta implementar tras la primera iteración.

## Backend
- `auditoria` (tabla): no existe en la DB. La función `registrarAuditoria()` fue añadida en `config.php`, pero hace falta crear la tabla y ejecutar la migración antes de usarla.
- `validaciones.php`: aún **no** creado (mencionado en el plan).
- `reportes.php?action=exportar_csv`: la ruta abre correctamente, pero el archivo CSV no se descarga/visualiza en tu entorno — posible causa: buffers, permisos de Apache/PHP o comportamiento del navegador. Requiere depuración en servidor (logs PHP/Apache).
- `busqueda.php`: endpoint funcional básico, pero requiere revisión de rendimiento y seguridad (limit, índices y sanitización adicional si se expone públicamente).
- Integración de auditoría: las APIs CRUD principales (estudiantes, talleres, inscripciones, clases, asistencia) **no** llaman todavía a `registrarAuditoria()` en todos los lugares; falta instrumentarlas para auditoría con `usuario_id` real.

## Frontend (Expo / React Native Web)
- `GlobalSearch`: implementado con debounce (350ms) y búsqueda inline con grouping y resaltado insensible a acentos; la vista modal ahora también muestra resultados agrupados y resaltados para mantener consistencia.
- `Exportar CSV`: el botón en `Dashboard` abre la URL en web; soporte móvil no implementado (requiere `expo-file-system` + `expo-sharing`).
-- `AsistenciaScreen` y `ClasesScreen`: mejoras UX propuestas (swipe, marcar masivo, vista semanal) parcialmente pendientes. Se corrigió la API cliente `src/api/asistencia.ts` (usar `action=por_clase` y `PUT` para marcar individual) y se añadió `marcarMasivo`. Además `AsistenciaScreen` ahora muestra botones masivos (Todos Presentes / Todos Ausentes) y contador en tiempo real.
- Estilos y consistencia visual: componentes nuevos (MetricCard, QuickActions, SimpleBarChart) son básicos y necesitan pulido según las propuestas de diseño.

## Datos / Base de datos
- El dump `talleres_municipales.sql` muestra el esquema principal; la tabla `auditoria` no está en el dump.
- `config.php` apunta por defecto al puerto `3307` — confirma que tu servidor MariaDB usa ese puerto (o actualiza `config.php`).

## Testing y despliegue
- Falta una batería básica de pruebas manuales (endpoints y UI). Recomendado:
  - Probar en navegador: `/api/dashboard.php`, `/api/busqueda.php?q=...`, `/api/reportes.php?action=exportar_csv`.
  - Revisar logs de Apache/PHP si `exportar_csv` no produce salida.
- Documentación mínima para QA: añadir README corto con endpoints y cómo probar (pendiente).

## Prioridad (recomendado siguiente pasos)
1. Añadir `auditoria` (migración SQL) o dejarlo para más adelante si no quieres tocar la BD ahora.
2. Añadir debouncing a `GlobalSearch` y mensajes UX (loading, sin resultados, error).
3. Implementar soporte de export CSV en móvil (opcional) o dejar descarga web como MVP.
4. Instrumentar `registrarAuditoria()` en endpoints CRUD críticos (requiere decidir cómo pasar `usuario_id`).
5. Realizar pruebas locales y corregir problemas de permisos/headers en `reportes.php` si persiste el problema de descarga.

Si quieres, implemento el punto 2 (debounce y UX) ahora. Para cambios en la DB (tabla `auditoria`) esperaré tu OK explícito.
