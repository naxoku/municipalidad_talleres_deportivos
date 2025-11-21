// Configuración de la API
import { Platform } from 'react-native';

export const API_URL = Platform.OS === 'web' 
  ? 'http://localhost/talleres_backend'
  : 'https://e88aadb1c9fd.ngrok-free.app/talleres_backend';

// Headers comunes para las peticiones
export const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
});

// Función para manejar respuestas de la API
export const handleApiResponse = async (response: Response) => {
    const data = await response.json();

    if (data.status === 'success') {
        return data;
    } else {
        throw new Error(data.mensaje || 'Error en la operación');
    }
};

// Función para manejar errores de red
export const handleNetworkError = (error: any) => {
    console.error('Error de red:', error);
    throw new Error('Error de conexión con el servidor');
};
