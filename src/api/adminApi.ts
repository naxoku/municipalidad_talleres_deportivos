import { API_URL } from "./config";
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Tipos ---
interface Usuario {
// ... (código existente sin cambios)
  id: number;
  nombre: string;
// ... (código existente sin cambios)
  email: string;
  rol: 'profesor' | 'estudiante';
}

interface Indumentaria {
// ... (código existente sin cambios)
  id: number;
  nombre: string;
// ... (código existente sin cambios)
  talla: string;
  stock: number;
}

// --- Funciones auxiliares ---

// MODIFICADO: handleResponse ahora devuelve el objeto de error completo
const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    // Devuelve el objeto de error completo, no solo el mensaje
    throw data; 
  }
  return data;
};

// NUEVO: Fetch para rutas de Autenticación (login) - NO envía token
const apiAuthFetch = async (endpoint: string, options: RequestInit = {}) => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  
  return fetch(`${API_URL}/api/${endpoint}`, { ...options, headers }).then(handleResponse);
};


// MODIFICADO: apiFetch ahora es para rutas SEGURAS (SÍ envía token)
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = await AsyncStorage.getItem('userToken');
// ... (código existente sin cambios)

  const headers: HeadersInit = {
    "Content-Type": "application/json",
// ... (código existente sin cambios)
    ...options.headers,
  };

  if (token) {
// ... (código existente sin cambios)
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(`${API_URL}/api/${endpoint}`, { ...options, headers }).then(handleResponse);
};


// --- NUEVO: API DE AUTENTICACIÓN (Movido desde auth.ts) ---

export const login = async (email?: string, contrasena?: string) => {
  // Validamos aquí por si acaso
  if (!email || !contrasena) {
    throw new Error("Email y contraseña son requeridos");
  }
  
  // Usamos apiAuthFetch (sin token)
  return apiAuthFetch("auth.php", {
    method: "POST",
    body: JSON.stringify({ email, contrasena }), // Nombres de campo correctos
  });
};

// (Si tuvieras un GET para verificar token, iría aquí usando apiFetch)
// export const verifyToken = () => apiFetch("auth.php");


// --- CRUD Profesores (Usa apiFetch seguro) ---
export const getProfesores = (): Promise<Usuario[]> => {
// ... (código existente sin cambios)
  return apiFetch("profesores.php");
};

export const createProfesor = (data: Omit<Usuario, 'id' | 'rol' | 'email'> & { email: string; contrasena: string }) => {
// ... (código existente sin cambios)
  return apiFetch("profesores.php", {
    method: "POST",
// ... (código existente sin cambios)
    body: JSON.stringify(data),
  });
};

export const updateProfesor = (id: number, data: Omit<Usuario, 'id' | 'rol' | 'email'> & { email: string; contrasena?: string }) => {
// ... (código existente sin cambios)
  return apiFetch(`profesores.php?id=${id}`, {
    method: "PUT",
// ... (código existente sin cambios)
    body: JSON.stringify(data),
  });
};

export const deleteProfesor = (id: number) => {
// ... (código existente sin cambios)
  return apiFetch(`profesores.php?id=${id}`, {
    method: "DELETE",
// ... (código existente sin cambios)
  });
};

// --- CRUD Estudiantes (Usa apiFetch seguro) ---
export const getEstudiantes = (): Promise<Usuario[]> => {
// ... (código existente sin cambios)
  return apiFetch("estudiantes.php");
};

export const createEstudiante = (data: Omit<Usuario, 'id' | 'rol' | 'email'> & { email: string; contrasena: string }) => {
// ... (código existente sin cambios)
  return apiFetch("estudiantes.php", {
    method: "POST",
// ... (código existente sin cambios)
    body: JSON.stringify(data),
  });
};

export const updateEstudiante = (id: number, data: Omit<Usuario, 'id' | 'rol' | 'email'> & { email: string; contrasena?: string }) => {
// ... (código existente sin cambios)
  return apiFetch(`estudiantes.php?id=${id}`, {
    method: "PUT",
// ... (código existente sin cambios)
    body: JSON.stringify(data),
  });
};

export const deleteEstudiante = (id: number) => {
// ... (código existente sin cambios)
  return apiFetch(`estudiantes.php?id=${id}`, {
    method: "DELETE",
// ... (código existente sin cambios)
  });
};

// --- CRUD Indumentaria (Usa apiFetch seguro) ---
export const getIndumentaria = (): Promise<Indumentaria[]> => {
// ... (código existente sin cambios)
  return apiFetch("indumentaria.php");
};

export const createIndumentaria = (data: Omit<Indumentaria, 'id'>) => {
// ... (código existente sin cambios)
  return apiFetch("indumentaria.php", {
    method: "POST",
// ... (código existente sin cambios)
    body: JSON.stringify(data),
  });
};

export const updateIndumentaria = (id: number, data: Omit<Indumentaria, 'id'>) => {
// ... (código existente sin cambios)
  return apiFetch(`indumentaria.php?id=${id}`, {
    method: "PUT",
// ... (código existente sin cambios)
    body: JSON.stringify(data),
  });
};

export const deleteIndumentaria = (id: number) => {
// ... (código existente sin cambios)
  return apiFetch(`indumentaria.php?id=${id}`, {
    method: "DELETE",
// ... (código existente sin cambios)
  });
};