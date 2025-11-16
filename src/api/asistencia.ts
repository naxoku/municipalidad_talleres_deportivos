import { API_URL, getHeaders, handleApiResponse, handleNetworkError } from './config';
import { Asistencia, ApiResponse } from '../types';

export const asistenciaApi = {
    listarPorClase: async (claseId: number): Promise<Asistencia[]> => {
        try {
            const response = await fetch(`${API_URL}/api/asistencia.php?action=por_clase&clase_id=${claseId}`, {
                headers: getHeaders(),
            });
            const data = await handleApiResponse(response);
            return data.datos || [];
        } catch (error) {
            handleNetworkError(error);
            return [];
        }
    },

    marcar: async (id: number, presente: boolean): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/asistencia.php?action=marcar`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ id, presente }),
            });
            return await handleApiResponse(response);
        } catch (error) {
            handleNetworkError(error);
            throw error;
        }
    },
    marcarMasivo: async (claseId: number, presente: boolean): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/asistencia.php?action=marcar_masivo`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ clase_id: claseId, presente: presente ? 1 : 0 }),
            });
            return await handleApiResponse(response);
        } catch (error) {
            handleNetworkError(error);
            throw error;
        }
    }
};
