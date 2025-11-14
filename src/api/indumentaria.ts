import { API_URL, getHeaders, handleApiResponse, handleNetworkError } from './config';
import { Indumentaria, IndumentariaTaller, ApiResponse } from '../types';

export const indumentariaApi = {
    listar: async (): Promise<Indumentaria[]> => {
        try {
            const response = await fetch(`${API_URL}/api/indumentaria.php?action=listar`, {
                headers: getHeaders(),
            });
            const data = await handleApiResponse(response);
            return data.datos || [];
        } catch (error) {
            handleNetworkError(error);
            return [];
        }
    },

    obtener: async (id: number): Promise<Indumentaria | null> => {
        try {
            const response = await fetch(`${API_URL}/api/indumentaria.php?action=obtener&id=${id}`, {
                headers: getHeaders(),
            });
            const data = await handleApiResponse(response);
            return data.datos || null;
        } catch (error) {
            handleNetworkError(error);
            return null;
        }
    },

    crear: async (indumentaria: Omit<Indumentaria, 'id'>): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/indumentaria.php?action=crear`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(indumentaria),
            });
            return await handleApiResponse(response);
        } catch (error) {
            handleNetworkError(error);
            throw error;
        }
    },

    actualizar: async (indumentaria: Indumentaria): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/indumentaria.php?action=actualizar`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(indumentaria),
            });
            return await handleApiResponse(response);
        } catch (error) {
            handleNetworkError(error);
            throw error;
        }
    },

    eliminar: async (id: number): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/indumentaria.php?action=eliminar`, {
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

    listarAsignaciones: async (): Promise<IndumentariaTaller[]> => {
        try {
            const response = await fetch(`${API_URL}/api/indumentaria_taller.php?action=listar`, {
                headers: getHeaders(),
            });
            const data = await handleApiResponse(response);
            return data.datos || [];
        } catch (error) {
            handleNetworkError(error);
            return [];
        }
    },

    asignarATaller: async (indumentaria_id: number, taller_id: number): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/indumentaria_taller.php?action=asignar`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ indumentaria_id, taller_id }),
            });
            return await handleApiResponse(response);
        } catch (error) {
            handleNetworkError(error);
            throw error;
        }
    },

    desasignar: async (id: number): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/indumentaria_taller.php?action=eliminar`, {
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
