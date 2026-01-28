import client from './client';
import { Vehicle } from './types';

// Base URL for file access
const getFileBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace('/v1', '');
    if (typeof window !== 'undefined') {
        return `http://${window.location.hostname}:3333`;
    }
    return 'http://localhost:3333';
};

export const fleetService = {
    /**
     * List vehicles for the authenticated company
     * Backend requires ownerType and ownerId. 
     * We'll need to fetch the company ID from the user profile or context.
     */
    async listVehicles(companyId: string) {
        return client.get<Vehicle[]>('/vehicles', {
            params: {
                ownerType: 'Company',
                ownerId: companyId
            }
        });
    },

    /**
     * Get a single vehicle
     */
    async getVehicle(vehicleId: string) {
        return client.get<Vehicle>(`/vehicles/${vehicleId}`);
    },

    /**
     * Create a new vehicle
     */
    async createVehicle(ownerId: string, data: Partial<Vehicle>) {
        return client.post<Vehicle>('/vehicles', {
            ...data,
            ownerType: 'Company',
            ownerId: ownerId
        });
    },

    /**
     * Update a vehicle
     */
    async updateVehicle(vehicleId: string, data: Partial<Vehicle>) {
        return client.put<Vehicle>(`/vehicles/${vehicleId}`, data);
    },

    /**
     * Delete a vehicle
     */
    async deleteVehicle(vehicleId: string) {
        return client.delete(`/vehicles/${vehicleId}`);
    },

    /**
     * Assign a driver to a vehicle
     */
    async assignDriver(vehicleId: string, driverId: string | null) {
        return client.post<Vehicle>(`/vehicles/${vehicleId}/assign-driver`, { driverId });
    },

    /**
     * Upload a document for a vehicle
     * NEW FORMAT: File field must be named after the docType
     */
    async uploadDocument(vehicleId: string, docType: string, file: File, expiryDate?: string) {
        const formData = new FormData();
        // The file field MUST be named after the docType for FileManager to process it
        formData.append(docType, file);
        formData.append('docType', docType);
        if (expiryDate) {
            formData.append('expiryDate', expiryDate);
        }

        return client.post(`/vehicles/${vehicleId}/documents`, formData);
    },

    /**
     * Get orders history for a vehicle
     */
    async getVehicleOrders(vehicleId: string) {
        return client.get<any[]>(`/vehicles/${vehicleId}/orders`);
    },

    /**
     * Get a file URL for viewing
     * NEW FORMAT: Uses /fs/:filename route
     */
    getFileUrl(filename: string) {
        // Extract just the filename if it starts with 'fs/'
        const cleanFilename = filename.startsWith('fs/') ? filename.substring(3) : filename;
        return `${getFileBaseUrl()}/fs/${cleanFilename}`;
    },

    /**
     * View a document by requesting a temporary signed URL
     */
    async getSignedUrl(filename: string) {
        // 1. Get just the filename (security)
        const cleanFilename = filename.startsWith('fs/') ? filename.substring(3) : filename;

        // 2. Fetch temporary token from server
        const { data } = await client.get<{ token: string }>(`/fs/token/${cleanFilename}`);

        // 3. Construct direct URL with token
        return `${getFileBaseUrl()}/fs/${cleanFilename}?token=${data.token}`;
    }
};
