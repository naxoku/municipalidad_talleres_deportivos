import api from "./axios";

export const dashboardApi = {
  getStats: async () => {
    const response = await api.get("/api/dashboard.php?action=stats");

    return response.data.datos || response.data;
  },

  getAlerts: async () => {
    const response = await api.get("/api/dashboard.php?action=alerts");

    return response.data.datos || response.data;
  },
};
