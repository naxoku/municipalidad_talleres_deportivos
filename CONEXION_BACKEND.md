# Configuración de Conexión Backend (Simplificado sin JWT)

## Resumen
Se ha configurado la conexión entre la aplicación React Native y el backend PHP ubicado en `C:\wamp64\www\talleres_backend`. El sistema está simplificado sin autenticación JWT para facilitar el desarrollo.

## Archivos Modificados

### 1. Frontend (React Native)

#### `src/api/config.ts`
- **URL actualizada**: `http://localhost/talleres_backend`
- **Antes**: `http://192.168.1.100/talleres_api`

#### `src/api/auth.ts`
- Función de login ya existente, ahora apunta a la nueva URL del backend.

#### `src/api/testConnection.ts` (Nuevo)
- Funciones para probar la conexión con el backend:
  - `testConnection()`: Prueba básica de conexión y CORS
  - `testLogin()`: Prueba de login con credenciales
  - `getUsers()`: Obtener lista de usuarios (sin autenticación)

### 2. Backend (PHP)

#### `C:\wamp64\www\talleres_backend\api\auth.php`
- **CORS mejorado**:
  - Métodos permitidos: `GET, POST, OPTIONS, PUT, DELETE`
  - Headers permitidos: `Content-Type, X-Requested-With`
  - Max-Age: 86400 segundos (24 horas)

#### `C:\wamp64\www\talleres_backend\api\usuarios.php` (Simplificado)
- **Eliminada autenticación JWT**: Ahora funciona sin tokens
- **CORS mejorado**:
  - Métodos permitidos: `GET, POST, PUT, DELETE, OPTIONS`
  - Headers permitidos: `Content-Type, X-Requested-With`
  - Max-Age: 86400 segundos (24 horas)

#### `C:\wamp64\www\talleres_backend\.htaccess` (Nuevo)
- Configuración global de CORS para todo el directorio
- Manejo de OPTIONS requests
- Permite solicitudes desde cualquier origen

## Cómo Probar la Conexión

### 1. Iniciar WAMP Server
Asegúrate de que WAMP Server esté ejecutándose y que MariaDB esté en el puerto 3307.

### 2. Probar desde la aplicación React Native
```typescript
import { testConnection, testLogin, getUsers } from './src/api/testConnection';

// Probar conexión básica
const isConnected = await testConnection();
console.log('Conexión exitosa:', isConnected);

// Probar login
try {
  const result = await testLogin('tu@email.com', 'tucontraseña');
  console.log('Login exitoso:', result);
} catch (error) {
  console.error('Error en login:', error);
}

// Obtener usuarios (sin autenticación)
try {
  const users = await getUsers();
  console.log('Usuarios obtenidos:', users);
} catch (error) {
  console.error('Error al obtener usuarios:', error);
}
```

### 3. Probar con archivo Node.js (Recomendado)
He creado un archivo de prueba que puedes ejecutar directamente:

```bash
# Instalar node-fetch si no lo tienes
npm install node-fetch

# Ejecutar las pruebas
node testConexion.js
```

Este archivo probará:
- Conexión básica con OPTIONS
- Endpoint de usuarios (GET)
- Endpoint de login (POST)

Y te dará resultados claros sobre si todo funciona correctamente.

### 3. Probar directamente desde el navegador
Abre tu navegador y visita:
- `http://localhost/talleres_backend/api/auth.php` (debería mostrar un error de método no permitido)
- `http://localhost/talleres_backend/api/usuarios.php` (debería mostrar la lista de usuarios o error si no hay datos)

## Configuración de Base de Datos
El backend está configurado para conectarse a:
- **Host**: `127.0.0.1`
- **Puerto**: `3307`
- **Base de datos**: `talleres_municipales`
- **Usuario**: `root`
- **Contraseña**: `''` (vacío)

## Endpoints Disponibles

### Auth
- **URL**: `http://localhost/talleres_backend/api/auth.php`
- **Método**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body**: `{ "email": "email", "contrasena": "password" }`

### Usuarios (Sin autenticación JWT)
- **URL**: `http://localhost/talleres_backend/api/usuarios.php`
- **Métodos**: `GET, POST, PUT, DELETE`
- **Headers**: `Content-Type: application/json`

## Posibles Problemas y Soluciones

### 1. CORS Error
- **Síntoma**: Error de CORS en la consola del navegador
- **Solución**: Verificar que el archivo `.htaccess` está en el directorio correcto y que WAMP tiene el módulo `mod_headers` habilitado

### 2. Conexión Rechazada
- **Síntoma**: Error de conexión al intentar acceder al backend
- **Solución**: Asegurarse de que WAMP Server esté ejecutándose y que el puerto 3307 esté abierto

### 3. Login Fallido
- **Síntoma**: Error al intentar hacer login
- **Solución**: Verificar que las credenciales existen en la base de datos y que la contraseña es correcta

## Pasos Siguientes
1. Probar la conexión desde la aplicación
2. Implementar el manejo de errores en los componentes de React Native
3. Crear usuarios de prueba en la base de datos si es necesario
4. Implementar las rutas protegidas basadas en el rol del usuario (sin JWT)

## LoginScreen.tsx Implementado
Se ha actualizado el archivo `src/screens/LoginScreen.tsx` con las siguientes mejoras:

### Cambios realizados:
- **Importación de API**: Se importó la función `login` desde `../api/auth`
- **Función handleLogin**: Reemplazada la simulación por una llamada real a la API
- **Manejo de errores**: Implementado manejo de errores con try/catch
- **Validación de roles**: El sistema ahora obtiene el rol del backend y lo pasa a `onLogin(rol)`
- **Placeholder actualizado**: Se cambió el placeholder del email a uno más realista

### Funcionamiento:
1. El usuario ingresa email y contraseña
2. Se llama a la API `http://localhost/talleres_backend/api/auth.php`
3. Si el login es exitoso, se obtiene el rol del usuario (`administrador` o `profesor`)
4. Se llama a `onLogin(rol)` con el rol correcto
5. La aplicación navega al dashboard correspondiente según el rol

### Usuarios de prueba disponibles:
- **admin@correo.cl** - rol: administrador
- **mlopez@correo.cl** - rol: profesor
- **cperez@correo.cl** - rol: profesor
- **ltorres@correo.cl** - rol: profesor
- **jdiaz@correo.cl** - rol: profesor

### Notas:
- El sistema ahora depende de la autenticación real del backend
- Los errores de conexión se muestran de forma clara al usuario
- El loading state indica cuando la autenticación está en progreso