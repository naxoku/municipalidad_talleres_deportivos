# Funciones por Rol en el Sistema de Talleres Deportivos

## Rol: Administrador

### Permisos Generales
- view_dashboard
- manage_talleres
- manage_alumnos
- manage_profesores
- manage_horarios
- manage_asistencia
- manage_ubicaciones
- generate_reports
- manage_users
- view_reports

### Funciones Específicas

#### Ver Dashboard Administrativo
- **Función**: Ver estadísticas generales del sistema (total alumnos, talleres, profesores, asistencia promedio, clases de hoy)
- **Método HTTP**: GET
- **Ruta API**: /api/dashboard.php?action=stats
- **Archivo Controlador**: src/dashboard/DashboardController.php::dashboard_getDashboardStats
- **Llamada Frontend**: dashboardApi.getStats (src/api/dashboard.ts)

#### Ver Alertas del Sistema
- **Función**: Ver alertas y notificaciones del sistema (horarios sin profesor, talleres inactivos, etc.)
- **Método HTTP**: GET
- **Ruta API**: /api/dashboard.php?action=alerts
- **Archivo Controlador**: src/dashboard/DashboardController.php::dashboard_getSystemAlerts
- **Llamada Frontend**: dashboardApi.getAlerts (src/api/dashboard.ts)

#### Gestionar Talleres
- **Función**: Listar talleres
- **Método HTTP**: GET
- **Ruta API**: /api/talleres.php?action=listar
- **Archivo Controlador**: src/talleres/TalleresController.php (función correspondiente)
- **Llamada Frontend**: talleresApi.getAll (src/features/talleres/api.ts)

- **Función**: Ver detalle de taller
- **Método HTTP**: GET
- **Ruta API**: /api/talleres.php?action=obtener&id=${id}
- **Archivo Controlador**: src/talleres/TalleresController.php
- **Llamada Frontend**: talleresApi.getById (src/features/talleres/api.ts)

- **Función**: Crear taller
- **Método HTTP**: POST
- **Ruta API**: /api/talleres.php?action=crear
- **Archivo Controlador**: src/talleres/TalleresController.php
- **Llamada Frontend**: talleresApi.create (src/features/talleres/api.ts)

- **Función**: Actualizar taller
- **Método HTTP**: PUT
- **Ruta API**: /api/talleres.php?action=actualizar&id=${id}
- **Archivo Controlador**: src/talleres/TalleresController.php
- **Llamada Frontend**: talleresApi.update (src/features/talleres/api.ts)

- **Función**: Eliminar taller
- **Método HTTP**: DELETE
- **Ruta API**: /api/talleres.php?action=eliminar&id=${id}
- **Archivo Controlador**: src/talleres/TalleresController.php
- **Llamada Frontend**: talleresApi.delete (src/features/talleres/api.ts)

- **Función**: Ver horarios de un taller
- **Método HTTP**: GET
- **Ruta API**: /api/horarios.php?action=por_taller&taller_id=${id}
- **Archivo Controlador**: src/horarios/HorariosController.php
- **Llamada Frontend**: talleresApi.getHorarios (src/features/talleres/api.ts)

- **Función**: Ver alumnos inscritos en un taller
- **Método HTTP**: GET
- **Ruta API**: /api/inscripciones.php?action=por_taller&taller_id=${id}
- **Archivo Controlador**: src/inscripciones/InscripcionesController.php
- **Llamada Frontend**: talleresApi.getAlumnos (src/features/talleres/api.ts)

- **Función**: Ver clases de un taller
- **Método HTTP**: GET
- **Ruta API**: /api/clases.php?action=por_taller&taller_id=${id}
- **Archivo Controlador**: src/clases/ClasesController.php
- **Llamada Frontend**: talleresApi.getClases (src/features/talleres/api.ts)

#### Gestionar Alumnos
- **Función**: Listar alumnos
- **Método HTTP**: GET
- **Ruta API**: /api/alumnos.php?action=listar
- **Archivo Controlador**: src/alumnos/AlumnosController.php
- **Llamada Frontend**: alumnosApi.getAll (src/features/alumnos/api.ts)

- **Función**: Ver detalle de alumno
- **Método HTTP**: GET
- **Ruta API**: /api/alumnos.php?action=obtener&id=${id}
- **Archivo Controlador**: src/alumnos/AlumnosController.php
- **Llamada Frontend**: alumnosApi.getById (src/features/alumnos/api.ts)

- **Función**: Crear alumno
- **Método HTTP**: POST
- **Ruta API**: /api/alumnos.php?action=crear
- **Archivo Controlador**: src/alumnos/AlumnosController.php
- **Llamada Frontend**: alumnosApi.create (src/features/alumnos/api.ts)

- **Función**: Actualizar alumno
- **Método HTTP**: PUT
- **Ruta API**: /api/alumnos.php?action=actualizar&id=${id}
- **Archivo Controlador**: src/alumnos/AlumnosController.php
- **Llamada Frontend**: alumnosApi.update (src/features/alumnos/api.ts)

- **Función**: Eliminar alumno
- **Método HTTP**: DELETE
- **Ruta API**: /api/alumnos.php?action=eliminar&id=${id}
- **Archivo Controlador**: src/alumnos/AlumnosController.php
- **Llamada Frontend**: alumnosApi.delete (src/features/alumnos/api.ts)

- **Función**: Ver talleres de un alumno
- **Método HTTP**: GET
- **Ruta API**: /api/alumnos.php?action=talleres&id=${id}
- **Archivo Controlador**: src/alumnos/AlumnosController.php
- **Llamada Frontend**: alumnosApi.getTalleres (src/features/alumnos/api.ts)

- **Función**: Ver asistencia de un alumno
- **Método HTTP**: GET
- **Ruta API**: /api/alumnos.php?action=asistencia&id=${id}
- **Archivo Controlador**: src/alumnos/AlumnosController.php
- **Llamada Frontend**: alumnosApi.getAsistencia (src/features/alumnos/api.ts)

#### Gestionar Profesores
- **Función**: Listar profesores
- **Método HTTP**: GET
- **Ruta API**: /api/profesores.php?action=listar
- **Archivo Controlador**: src/profesores/ProfesoresController.php::profesores_listarProfesores
- **Llamada Frontend**: profesoresApi.getAll (src/features/profesores/api.ts)

- **Función**: Ver detalle de profesor
- **Método HTTP**: GET
- **Ruta API**: /api/profesores.php?action=obtener&id=${id}
- **Archivo Controlador**: src/profesores/ProfesoresController.php::profesores_obtenerProfesor
- **Llamada Frontend**: profesoresApi.getById (src/features/profesores/api.ts)

- **Función**: Crear profesor
- **Método HTTP**: POST
- **Ruta API**: /api/profesores.php?action=crear
- **Archivo Controlador**: src/profesores/ProfesoresController.php::profesores_crearProfesor
- **Llamada Frontend**: profesoresApi.create (src/features/profesores/api.ts)

- **Función**: Actualizar profesor
- **Método HTTP**: PUT
- **Ruta API**: /api/profesores.php?action=actualizar&id=${id}
- **Archivo Controlador**: src/profesores/ProfesoresController.php::profesores_actualizarProfesor
- **Llamada Frontend**: profesoresApi.update (src/features/profesores/api.ts)

- **Función**: Ver talleres de un profesor
- **Método HTTP**: GET
- **Ruta API**: /api/profesores.php?action=talleres&id=${id}
- **Archivo Controlador**: src/profesores/ProfesoresController.php::profesores_obtenerTalleresProfesor
- **Llamada Frontend**: profesoresApi.getTalleres (src/features/profesores/api.ts)

- **Función**: Ver horarios de un profesor
- **Método HTTP**: GET
- **Ruta API**: /api/profesores.php?action=horarios&id=${id}
- **Archivo Controlador**: src/profesores/ProfesoresController.php::profesores_obtenerHorariosProfesor
- **Llamada Frontend**: profesoresApi.getHorarios (src/features/profesores/api.ts)

- **Función**: Ver alumnos de un profesor
- **Método HTTP**: GET
- **Ruta API**: /api/profesores.php?action=alumnos&id=${id}
- **Archivo Controlador**: src/profesores/ProfesoresController.php::profesores_obtenerAlumnosProfesor
- **Llamada Frontend**: profesoresApi.getAlumnos (src/features/profesores/api.ts)

- **Función**: Ver clases de un profesor
- **Método HTTP**: GET
- **Ruta API**: /api/profesores.php?action=clases&id=${id}
- **Archivo Controlador**: src/profesores/ProfesoresController.php::profesores_obtenerClasesProfesor
- **Llamada Frontend**: profesoresApi.getClases (src/features/profesores/api.ts)

#### Gestionar Horarios
- **Función**: Listar horarios
- **Método HTTP**: GET
- **Ruta API**: /api/horarios.php?action=listar
- **Archivo Controlador**: src/horarios/HorariosController.php
- **Llamada Frontend**: horariosApi.getAll (src/api/horarios.ts)

- **Función**: Ver detalle de horario
- **Método HTTP**: GET
- **Ruta API**: /api/horarios.php?action=obtener&id=${id}
- **Archivo Controlador**: src/horarios/HorariosController.php
- **Llamada Frontend**: horariosApi.getById (src/api/horarios.ts)

- **Función**: Actualizar horario
- **Método HTTP**: POST
- **Ruta API**: /api/horarios.php?action=actualizar
- **Archivo Controlador**: src/horarios/HorariosController.php
- **Llamada Frontend**: horariosApi.update (src/api/horarios.ts)

- **Función**: Ver alumnos de un horario
- **Método HTTP**: GET
- **Ruta API**: /api/horarios.php?action=alumnos&id=${id}
- **Archivo Controlador**: src/horarios/HorariosController.php
- **Llamada Frontend**: horariosApi.getAlumnos (src/api/horarios.ts)

- **Función**: Ver clases de un horario
- **Método HTTP**: GET
- **Ruta API**: /api/horarios.php?action=clases&id=${id}
- **Archivo Controlador**: src/horarios/HorariosController.php
- **Llamada Frontend**: horariosApi.getClases (src/api/horarios.ts)

#### Gestionar Inscripciones
- **Función**: Listar inscripciones
- **Método HTTP**: GET
- **Ruta API**: /api/inscripciones.php?action=listar
- **Archivo Controlador**: src/inscripciones/InscripcionesController.php
- **Llamada Frontend**: inscripcionesApi.getAll (src/features/inscripciones/api.ts)

- **Función**: Crear inscripción
- **Método HTTP**: POST
- **Ruta API**: /api/inscripciones.php?action=crear
- **Archivo Controlador**: src/inscripciones/InscripcionesController.php
- **Llamada Frontend**: inscripcionesApi.crear (src/features/inscripciones/api.ts)

- **Función**: Actualizar inscripción
- **Método HTTP**: PUT
- **Ruta API**: /api/inscripciones.php?action=actualizar&id=${id}
- **Archivo Controlador**: src/inscripciones/InscripcionesController.php
- **Llamada Frontend**: inscripcionesApi.actualizar (src/features/inscripciones/api.ts)

- **Función**: Eliminar inscripción
- **Método HTTP**: DELETE
- **Ruta API**: /api/inscripciones.php?action=eliminar&id=${id}
- **Archivo Controlador**: src/inscripciones/InscripcionesController.php
- **Llamada Frontend**: inscripcionesApi.eliminar (src/features/inscripciones/api.ts)

#### Gestionar Ubicaciones
- **Función**: Listar ubicaciones
- **Método HTTP**: GET
- **Ruta API**: /api/ubicaciones.php?action=listar
- **Archivo Controlador**: src/ubicaciones/UbicacionesController.php
- **Llamada Frontend**: ubicacionesApi.getAll (src/api/ubicaciones.ts)

- **Función**: Ver detalle de ubicación
- **Método HTTP**: GET
- **Ruta API**: /api/ubicaciones.php?action=obtener&id=${id}
- **Archivo Controlador**: src/ubicaciones/UbicacionesController.php
- **Llamada Frontend**: ubicacionesApi.getById (src/api/ubicaciones.ts)

- **Función**: Crear ubicación
- **Método HTTP**: POST
- **Ruta API**: /api/ubicaciones.php?action=crear
- **Archivo Controlador**: src/ubicaciones/UbicacionesController.php
- **Llamada Frontend**: ubicacionesApi.create (src/api/ubicaciones.ts)

- **Función**: Actualizar ubicación
- **Método HTTP**: PUT
- **Ruta API**: /api/ubicaciones.php?action=actualizar&id=${id}
- **Archivo Controlador**: src/ubicaciones/UbicacionesController.php
- **Llamada Frontend**: ubicacionesApi.update (src/api/ubicaciones.ts)

- **Función**: Eliminar ubicación
- **Método HTTP**: DELETE
- **Ruta API**: /api/ubicaciones.php?action=eliminar&id=${id}
- **Archivo Controlador**: src/ubicaciones/UbicacionesController.php
- **Llamada Frontend**: ubicacionesApi.delete (src/api/ubicaciones.ts)

#### Generar Reportes
- **Función**: Exportar alumnos a CSV
- **Método HTTP**: GET
- **Ruta API**: /api/reportes.php?action=exportar_csv
- **Archivo Controlador**: src/reportes/ReportesController.php::reportes_exportarCsv
- **Llamada Frontend**: No implementada en frontend (solo UI en reportes.tsx)

## Rol: Profesor

### Permisos Generales
- view_dashboard
- view_my_talleres
- view_my_alumnos
- manage_asistencia
- view_horarios
- manage_planificacion
- view_simple_reports

### Funciones Específicas

#### Ver Dashboard del Profesor
- **Función**: Ver métricas personales (total talleres, total alumnos, clases hoy, asistencia promedio)
- **Método HTTP**: GET
- **Ruta API**: /api/profesor_dashboard.php?profesor_id=${id}
- **Archivo Controlador**: src/profesores/ProfesoresController.php::profesores_getDashboardProfesor
- **Llamada Frontend**: profesorApi.getDashboard (src/api/profesor.ts)

#### Ver Mis Talleres
- **Función**: Listar talleres asignados al profesor
- **Método HTTP**: GET
- **Ruta API**: /api/profesor_talleres.php?id=${id}
- **Archivo Controlador**: src/profesores/ProfesoresController.php::profesores_obtenerTalleresProfesor
- **Llamada Frontend**: profesorApi.getTalleres (src/api/profesor.ts)

#### Ver Mis Alumnos
- **Función**: Listar alumnos inscritos en talleres del profesor
- **Método HTTP**: GET
- **Ruta API**: /api/profesor_alumnos.php?profesor_id=${id}
- **Archivo Controlador**: src/profesores/ProfesoresController.php::profesores_obtenerAlumnosProfesor
- **Llamada Frontend**: profesorApi.getAlumnos (src/api/profesor.ts)

#### Gestionar Asistencia
- **Función**: Ver horarios con alumnos para tomar asistencia
- **Método HTTP**: GET
- **Ruta API**: /api/profesor_asistencia.php?action=horarios_con_alumnos&profesor_id=${id}
- **Archivo Controlador**: src/asistencia/AsistenciaController.php::asistencia_getHorariosConAlumnos
- **Llamada Frontend**: asistenciaApi.getHorariosConAlumnos (src/api/asistencia.ts)

- **Función**: Ver alumnos de un horario específico
- **Método HTTP**: GET
- **Ruta API**: /api/profesor_asistencia.php?action=alumnos_por_horario&horario_id=${id}
- **Archivo Controlador**: src/asistencia/AsistenciaController.php::asistencia_getAlumnosPorHorario
- **Llamada Frontend**: asistenciaApi.getAlumnosPorHorario (src/api/asistencia.ts)

- **Función**: Ver asistencia de una fecha específica
- **Método HTTP**: GET
- **Ruta API**: /api/profesor_asistencia.php?action=asistencia_fecha&horario_id=${id}&fecha=${fecha}
- **Archivo Controlador**: src/asistencia/AsistenciaController.php::asistencia_getAsistenciaFecha
- **Llamada Frontend**: asistenciaApi.getAsistenciaFecha (src/api/asistencia.ts)

- **Función**: Guardar asistencia
- **Método HTTP**: POST
- **Ruta API**: /api/profesor_asistencia.php?action=guardar_asistencia
- **Archivo Controlador**: src/asistencia/AsistenciaController.php::asistencia_guardarAsistencia
- **Llamada Frontend**: asistenciaApi.guardarAsistencia (src/api/asistencia.ts)

#### Gestionar Planificación de Clases
- **Función**: Ver detalles de clases
- **Método HTTP**: GET
- **Ruta API**: /api/detalle_clase.php?[filters]
- **Archivo Controlador**: src/detalle_clase/DetalleClaseController.php
- **Llamada Frontend**: detalleClaseApi.getDetalles (src/api/detalle_clase.ts)

- **Función**: Ver detalle de una clase específica
- **Método HTTP**: GET
- **Ruta API**: /api/detalle_clase.php?id=${id}
- **Archivo Controlador**: src/detalle_clase/DetalleClaseController.php
- **Llamada Frontend**: detalleClaseApi.getDetalleById (src/api/detalle_clase.ts)

- **Función**: Crear detalle de clase
- **Método HTTP**: POST
- **Ruta API**: /api/detalle_clase.php
- **Archivo Controlador**: src/detalle_clase/DetalleClaseController.php
- **Llamada Frontend**: detalleClaseApi.createDetalle (src/api/detalle_clase.ts)

- **Función**: Actualizar detalle de clase
- **Método HTTP**: PUT
- **Ruta API**: /api/detalle_clase.php
- **Archivo Controlador**: src/detalle_clase/DetalleClaseController.php
- **Llamada Frontend**: detalleClaseApi.updateDetalle (src/api/detalle_clase.ts)

- **Función**: Eliminar detalle de clase
- **Método HTTP**: DELETE
- **Ruta API**: /api/detalle_clase.php?[params]
- **Archivo Controlador**: src/detalle_clase/DetalleClaseController.php
- **Llamada Frontend**: detalleClaseApi.deleteDetalle (src/api/detalle_clase.ts)

- **Función**: Ver clases por horario
- **Método HTTP**: GET
- **Ruta API**: /api/clases.php?action=por_horario&horario_id=${id}
- **Archivo Controlador**: src/clases/ClasesController.php
- **Llamada Frontend**: detalleClaseApi.getClasesPorHorario (src/api/detalle_clase.ts)

#### Ver Horarios
- **Función**: Listar todos los horarios (para planificación)
- **Método HTTP**: GET
- **Ruta API**: /api/horarios.php?action=listar
- **Archivo Controlador**: src/horarios/HorariosController.php
- **Llamada Frontend**: horariosApi.getAll (src/api/horarios.ts)

- **Función**: Ver detalle de horario
- **Método HTTP**: GET
- **Ruta API**: /api/horarios.php?action=obtener&id=${id}
- **Archivo Controlador**: src/horarios/HorariosController.php
- **Llamada Frontend**: horariosApi.getById (src/api/horarios.ts)

- **Función**: Ver alumnos de un horario
- **Método HTTP**: GET
- **Ruta API**: /api/horarios.php?action=alumnos&id=${id}
- **Archivo Controlador**: src/horarios/HorariosController.php
- **Llamada Frontend**: horariosApi.getAlumnos (src/api/horarios.ts)

- **Función**: Ver clases de un horario
- **Método HTTP**: GET
- **Ruta API**: /api/horarios.php?action=clases&id=${id}
- **Archivo Controlador**: src/horarios/HorariosController.php
- **Llamada Frontend**: horariosApi.getClases (src/api/horarios.ts)

#### Ver Profesores (para referencia)
- **Función**: Ver horarios asignados (solo los propios)
- **Método HTTP**: GET
- **Ruta API**: /api/profesores.php?action=horarios&id=${id}
- **Archivo Controlador**: src/profesores/ProfesoresController.php::profesores_obtenerHorariosProfesor
- **Llamada Frontend**: profesoresApi.getHorarios (src/features/profesores/api.ts)

#### Ver Clases (para referencia)
- **Función**: Ver clases asignadas (solo las propias)
- **Método HTTP**: GET
- **Ruta API**: /api/profesores.php?action=clases&id=${id}
- **Archivo Controlador**: src/profesores/ProfesoresController.php::profesores_obtenerClasesProfesor
- **Llamada Frontend**: profesoresApi.getClases (src/features/profesores/api.ts)