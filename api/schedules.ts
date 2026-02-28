import client from './client';
import { Schedule } from './types';

// Helper to convert object keys from camelCase to snake_case
const toSnakeCase = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(toSnakeCase);
    if (obj !== null && typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj).map(([key, val]) => [
                key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`),
                toSnakeCase(val)
            ])
        );
    }
    return obj;
};

// Helper to convert object keys from snake_case to camelCase
const toCamelCase = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(toCamelCase);
    if (obj !== null && typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj).map(([key, val]) => [
                key.replace(/(_\w)/g, m => m[1].toUpperCase()),
                toCamelCase(val)
            ])
        );
    }
    return obj;
};

export const scheduleService = {
    listSchedules: async (ownerId: string, ownerType: string = 'Company') => {
        const { data } = await client.get('/schedules', { params: { owner_id: ownerId, owner_type: ownerType } });
        return toCamelCase(data) as Schedule[];
    },

    createSchedule: async (data: Partial<Schedule>) => {
        const payload = toSnakeCase(data);
        const response = await client.post('/schedules', payload);
        return toCamelCase(response.data) as Schedule;
    },

    getSchedule: async (id: string) => {
        const { data } = await client.get(`/schedules/${id}`);
        return toCamelCase(data) as Schedule;
    },

    updateSchedule: async (id: string, data: Partial<Schedule>) => {
        const payload = toSnakeCase(data);
        const response = await client.put(`/schedules/${id}`, payload);
        return toCamelCase(response.data) as Schedule;
    },

    deleteSchedule: (id: string) => {
        return client.delete(`/schedules/${id}`);
    },

    assignUsers: (scheduleId: string, userIds: string[]) => {
        return client.post(`/schedules/${scheduleId}/assign-users`, { user_ids: userIds });
    },

    unassignUsers: (scheduleId: string, userIds: string[]) => {
        return client.delete(`/schedules/${scheduleId}/unassign-users`, { user_ids: userIds });
    },

    getAssignedUsers: async (scheduleId: string) => {
        const { data } = await client.get(`/schedules/${scheduleId}/assigned-users`);
        return toCamelCase(data);
    },

    getCalendarView: async (params: {
        view: 'day' | 'week' | 'month';
        date: string;
        ownerId: string;
        ownerType: string;
    }) => {
        const queryParams = toSnakeCase(params);
        const { data } = await client.get('/schedules/calendar', { params: queryParams });
        return {
            ...toCamelCase(data),
            schedules: (data.schedules || []).map(toCamelCase)
        };
    }
};
