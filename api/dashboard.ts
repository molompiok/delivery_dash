import client from "./client";
import { DashboardStats } from "./types";

export const dashboardApi = {
    /**
     * Get consolidated stats for the company dashboard
     */
    getStats: async () => {
        const response = await client.get<DashboardStats>('/company/dashboard/stats');
        return response.data;
    }
};
