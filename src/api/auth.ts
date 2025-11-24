import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost/talleres_backend";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user: {
    id: number;
    email: string;
    nombre: string;
    rol: "admin" | "profesor";
    profesor_id?: number;
    token: string;
  };
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await axios.post(`${API_URL}/api/auth.php`, credentials);

    return response.data;
  },

  logout: async (_token: string): Promise<void> => {
    // Opcional: llamar a endpoint de logout en el backend
    // await axios.post(`${API_URL}/api/auth.php`, { action: 'logout', token });
  },
};
