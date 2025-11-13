import { API_URL } from "./config";

/**
 * Función para probar la conexión con el backend
 * @returns {Promise<boolean>} - true si la conexión es exitosa, false si hay error
 */
export async function testConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/usuarios.php`, {
      method: "OPTIONS", // Usamos OPTIONS para probar CORS
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Content-Type",
      },
    });

    if (response.ok) {
      console.log("✅ Conexión exitosa con el backend");
      return true;
    } else {
      console.error("❌ Error en la conexión:", response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error("❌ Error al conectar con el backend:", error);
    return false;
  }
}

/**
 * Función para probar el login con credenciales de prueba
 * @param {string} email - Email de prueba
 * @param {string} password - Contraseña de prueba
 * @returns {Promise<any>} - Respuesta del servidor
 */
export async function testLogin(email: string = "test@example.com", password: string = "password123"): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/auth.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, contrasena: password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Error en login");
    }
    
    console.log("✅ Login de prueba exitoso");
    return data;
  } catch (error) {
    console.error("❌ Error en login de prueba:", error);
    throw error;
  }
}

/**
 * Función para obtener la lista de usuarios (sin autenticación JWT)
 * @returns {Promise<any>} - Lista de usuarios
 */
export async function getUsers(): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/usuarios.php`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Error al obtener usuarios");
    }
    
    console.log("✅ Usuarios obtenidos exitosamente");
    return data;
  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error);
    throw error;
  }
}