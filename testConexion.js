/**
 * Archivo de prueba simple para verificar la conexión con el backend
 * Ejecuta este archivo con Node.js: node testConexion.js
 */

const fetch = require('node-fetch');

const API_URL = 'http://localhost/talleres_backend';

async function testBackendConnection() {
  console.log('🔍 Iniciando pruebas de conexión con el backend...\n');

  try {
    // 1. Probar conexión básica con OPTIONS
    console.log('1. Probando conexión básica con OPTIONS...');
    const optionsResponse = await fetch(`${API_URL}/api/usuarios.php`, {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Request-Method': 'GET',
      },
    });

    if (optionsResponse.ok) {
      console.log('✅ Conexión básica exitosa');
    } else {
      console.log('❌ Error en conexión básica:', optionsResponse.status, optionsResponse.statusText);
    }

    // 2. Probar endpoint de usuarios (GET)
    console.log('\n2. Probando endpoint de usuarios (GET)...');
    const usersResponse = await fetch(`${API_URL}/api/usuarios.php`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('✅ Endpoint de usuarios funciona correctamente');
      console.log('📋 Respuesta:', usersData);
    } else {
      console.log('❌ Error en endpoint de usuarios:', usersResponse.status, usersResponse.statusText);
    }

    // 3. Probar login con usuario existente
    console.log('\n3. Probando endpoint de login...');
    const loginResponse = await fetch(`${API_URL}/api/auth.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@correo.cl',
        contrasena: '1234' // Cambia esto por la contraseña real del admin
      }),
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login funciona correctamente');
      console.log('🔐 Respuesta de login:', loginData);
    } else {
      const errorData = await loginResponse.json();
      console.log('❌ Error en login:', loginResponse.status, loginResponse.statusText);
      console.log('📝 Detalle del error:', errorData.error || 'Error desconocido');
    }

    console.log('\n🎉 Pruebas completadas!');

  } catch (error) {
    console.error('❌ Error fatal durante las pruebas:', error.message);
    console.log('\n🔧 Posibles soluciones:');
    console.log('1. Asegúrate de que WAMP Server esté ejecutándose');
    console.log('2. Verifica que el puerto 80 (HTTP) esté disponible');
    console.log('3. Confirma que el directorio talleres_backend existe en C:\\wamp64\\www\\');
    console.log('4. Revisa que el archivo .htaccess esté correctamente configurado');
  }
}

// Ejecutar las pruebas
testBackendConnection();