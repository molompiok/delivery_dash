import client from './client';
import { Schedule } from './types';

export const scheduleService = {
    listSchedules: (ownerId: string, ownerType: string = 'Company') => {
        return client.get('/schedules', { params: { ownerId, ownerType } });
    },

    createSchedule: (data: any) => {
        return client.post('/schedules', data);
    },

    getSchedule: (id: string) => {
        return client.get(`/schedules/${id}`);
    },

    updateSchedule: (id: string, data: any) => {
        return client.put(`/schedules/${id}`, data);
    },

    deleteSchedule: (id: string) => {
        return client.delete(`/schedules/${id}`);
    },

    assignUsers: (scheduleId: string, userIds: string[]) => {
        return client.post(`/schedules/${scheduleId}/assign-users`, { userIds });
    },

    unassignUsers: (scheduleId: string, userIds: string[]) => {
        return client.delete(`/schedules/${scheduleId}/unassign-users`, { userIds });
    },

    getAssignedUsers: (scheduleId: string) => {
        return client.get(`/schedules/${scheduleId}/assigned-users`);
    },

    getCalendarView: (params: {
        view: 'day' | 'week' | 'month';
        date: string;
        ownerId: string;
        ownerType: string;
    }) => {
        return client.get('/schedules/calendar', { params });
    }
};
