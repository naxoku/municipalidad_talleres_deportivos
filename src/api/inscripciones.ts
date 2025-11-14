import { API_URL, getHeaders, handleApiResponse, handleNetworkError } from './config';
import { Inscripcion, ApiResponse } from '../types';

export const inscripcionesApi = {
    listar: async (): Promise<Inscripcion[]> => {
        try {
            const response = await fetch(`${API_URL}/api/inscripciones.php?action=listar`, {
                headers: getHeaders(),
            });
            const data = await handleApiResponse(response);
            return data.datos || [];
        } catch (error) {
            handleNetworkError(error);
            return [];
        }
    },

    crear: async (inscripcion: Omit<Inscripcion, 'id'>): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/inscripciones.php?action=crear`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(inscripcion),
            });
            return await handleApiResponse(response);
        } catch (error) {
            handleNetworkError(error);
            throw error;
        }
    },

    eliminar: async (id: number): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/inscripciones.php?action=eliminar`, {
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
