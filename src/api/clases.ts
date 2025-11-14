import { API_URL, getHeaders, handleApiResponse, handleNetworkError } from './config';
import { Clase, ApiResponse } from '../types';

export const clasesApi = {
    listar: async (): Promise<Clase[]> => {
        try {
            const response = await fetch(`${API_URL}/api/clases.php?action=listar`, {
                headers: getHeaders(),
            });
            const data = await handleApiResponse(response);
            return data.datos || [];
        } catch (error) {
            handleNetworkError(error);
            return [];
        }
    },

    crear: async (clase: Omit<Clase, 'id'>): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/clases.php?action=crear`, {
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
            const response = await fetch(`${API_URL}/api/clases.php?action=eliminar`, {
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
