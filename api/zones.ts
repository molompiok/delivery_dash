import client from './client';
import { Zone } from './mock'; // Temporarily importing from mock until moved to types

export const zoneService = {
    async list() {
        const { data } = await client.get<Zone[]>('/zones');
        return data;
    },

    async get(id: string) {
        const { data } = await client.get<Zone>(`/zones/${id}`);
        return data;
    },

    async create(data: Partial<Zone>) {
        const { data: zone } = await client.post<Zone>('/zones', data);
        return zone;
    },

    async update(id: string, data: Partial<Zone>) {
        const { data: zone } = await client.patch<Zone>(`/zones/${id}`, data);
        return zone;
    },

    async delete(id: string) {
        await client.delete(`/zones/${id}`);
    },

    // Install a Sublymus zone (creates a copy for the company)
    async installFromSublymus(zoneId: string) {
        const { data } = await client.post<{ zone: Zone; sourceZone: Zone }>(`/zones/${zoneId}/install`);
        return data;
    },

    // Get active drivers for a zone
    async getActiveDrivers(zoneId: string) {
        const { data } = await client.get<{ zone: any; activeDrivers: any[]; count: number }>(`/zones/${zoneId}/drivers`);
        return data;
    },

    // Set active zone for a driver in ETP mode (Manager action)
    async setActiveZoneETP(zoneId: string, driverId: string) {
        const { data } = await client.post(`/zones/${zoneId}/set-active-etp`, { driverId });
        return data;
    },

    // Clear active zone for a driver in ETP mode
    async clearActiveZoneETP(driverId: string) {
        const { data } = await client.post('/zones/clear-active-etp', { driverId });
        return data;
    }
};

