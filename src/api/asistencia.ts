import { API_URL, getHeaders, handleApiResponse, handleNetworkError } from './config';
import { Asistencia, ApiResponse } from '../types';

export const asistenciaApi = {
    // NUEVO: listar por sesión (horario + fecha)
    listarPorSesion: async (horarioId: number, fecha: string): Promise<Asistencia[]> => {
        try {
            const url = `${API_URL}/api/asistencia.php?action=por_sesion&horario_id=${horarioId}&fecha=${encodeURIComponent(fecha)}`;
            const response = await fetch(url, { headers: getHeaders() });
            const data = await handleApiResponse(response);
            return data.datos || [];
        } catch (error) {
            handleNetworkError(error);
            return [];
        }
    },

    listarPorClase: async (claseId: number): Promise<Asistencia[]> => {
        try {
            // Compatibilidad: obtener detalle de la clase y pedir asistencia por sesión (horario + fecha)
            const resp = await fetch(`${API_URL}/api/clases.php?action=obtener&id=${claseId}`, { headers: getHeaders() });
            const det = await handleApiResponse(resp);
            const detalle = det.datos;
            if (!detalle) return [];
            const horarioId = detalle.horario_id || detalle.horarioId;
            const fecha = detalle.fecha_clase || detalle.fecha;
            if (!horarioId || !fecha) return [];
            return await (async () => {
                const url = `${API_URL}/api/asistencia.php?action=por_sesion&horario_id=${horarioId}&fecha=${encodeURIComponent(fecha)}`;
                const response = await fetch(url, { headers: getHeaders() });
                const data = await handleApiResponse(response);
                return data.datos || [];
            })();
        } catch (error) {
            handleNetworkError(error);
            return [];
        }
    },

    marcarSesion: async (horario_id: number, fecha: string, estudiante_id: number, presente: boolean): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/asistencia.php?action=marcar`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ horario_id, fecha, estudiante_id, presente: presente ? 1 : 0 }),
            });
            return await handleApiResponse(response);
        } catch (error) {
            handleNetworkError(error);
            throw error;
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
    // NUEVO: marcar masivo por sesión
    marcarMasivoSesion: async (horario_id: number, fecha: string, presente: boolean): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/asistencia.php?action=marcar_masivo`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ horario_id, fecha, presente: presente ? 1 : 0 }),
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
