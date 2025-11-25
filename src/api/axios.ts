import axios from "axios";

// URL base del backend
export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost/talleres_backend";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar el token a las peticiones
api.interceptors.request.use(
  (config) => {
    const userStr = localStorage.getItem("user");

    if (userStr) {
      const user = JSON.parse(userStr);

      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido: eliminar user y emitir evento para que el
      // AuthProvider maneje el logout / redirección de forma centralizada.
      // (Esto evita redirecciones globales impredecibles al abrir la app en
      // otra pestaña mientras el provider se inicializa.)
      try {
        localStorage.removeItem("user");
      } catch {
        /* ignored */
      }

      try {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      } catch {
        // Fallback: no hacer navegación forzada aquí
      }
    }

    return Promise.reject(error);
  },
);

export default api;
