import ApiClient from './client';

export interface DriverLocation {
    id: string;
    lat: number;
    lng: number;
    heading?: number;
    updated_at: string;
}

export const trackingApi = {
    async getDriverLocation(id: string): Promise<DriverLocation> {
        const { data } = await ApiClient.get(`/driver/${id}/location`);
        return data;
    },
    async getAllDriversLocations(): Promise<DriverLocation[]> {
        const { data } = await ApiClient.get(`/drivers/locations`);
        return data;
    }
};
