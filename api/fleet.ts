import client from './client';
import { Vehicle } from './types';
import { documentService } from './documents';


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

    getFileUrl(filename: string) {
        return documentService.getFileUrl(filename);
    },

    async getSignedUrl(filename: string) {
        return documentService.getSignedUrl(filename);
    }
};
