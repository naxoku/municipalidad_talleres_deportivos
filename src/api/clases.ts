import { API_URL, getHeaders, handleApiResponse, handleNetworkError } from './config';
import { Clase, ApiResponse } from '../types';

export const clasesApi = {
    listar: async (): Promise<Clase[]> => {
        try {
            const response = await fetch(`${API_URL}/api/detalle_clase.php?action=listar`, {
                headers: getHeaders(),
            });
            const data = await handleApiResponse(response);
            // Normalizar respuesta: el backend devuelve 'fecha_clase', mapear a 'fecha' si es necesario
            const raw = data.datos || [];
            return raw.map((r: any) => ({
                ...r,
                fecha: r.fecha_clase || r.fecha || null,
            }));
        } catch (error) {
            handleNetworkError(error);
            return [];
        }
    },

    crear: async (clase: Omit<Clase, 'id' | 'fecha_creacion' | 'ultima_modificacion'>): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/detalle_clase.php?action=crear`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(clase),
            });
            return await handleApiResponse(response);
        } catch (error) {
            handleNetworkError(error);
            throw error;
        }
    },

    eliminar: async (id: number): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/detalle_clase.php?action=eliminar`, {
                method: 'DELETE',
                headers: getHeaders(),
                body: JSON.stringify({ id }),
            });
            return await handleApiResponse(response);
        } catch (error) {
            handleNetworkError(error);
            throw error;
        }
    },
};
