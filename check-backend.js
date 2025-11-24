#!/usr/bin/env node

import axios from 'axios';

const API_URL = process.env.VITE_BACKEND_URL || 'http://localhost/talleres_backend';

async function checkBackend() {
  try {
    console.log(`🔍 Verificando conexión con el backend en: ${API_URL}`);
    const response = await axios.get(`${API_URL}/api/talleres.php?action=listar`, { timeout: 5000 });
    console.log('✅ Talleres endpoint: OK');
    console.log(`📊 Respuesta: ${response.status} ${response.statusText}`);

    // Verificar estudiantes
    const estudiantesResponse = await axios.get(`${API_URL}/api/estudiantes.php?action=listar`, { timeout: 5000 });
    console.log('✅ Estudiantes endpoint: OK');

    // Verificar dashboard
    const dashboardResponse = await axios.get(`${API_URL}/api/dashboard.php?action=stats`, { timeout: 5000 });
    console.log('✅ Dashboard endpoint: OK');

  } catch (error) {
    console.log('❌ Error al conectar con el backend');
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Asegúrate de que el servidor backend esté ejecutándose');
    } else if (error.response) {
      console.log(`📊 Respuesta del servidor: ${error.response.status} ${error.response.statusText}`);
    } else {
      console.log(`📊 Error: ${error.message}`);
    }
    process.exit(1);
  }
}

checkBackend();