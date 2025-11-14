// Configuración de la API
export const API_URL = 'http://localhost/talleres_backend';

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
