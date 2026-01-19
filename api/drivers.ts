import client from './client';
import { User, CompanyDriverSetting } from './types';

export const driverService = {
    /**
     * List drivers belonging to the authenticated company
     */
    async listDrivers(filters: { status?: string, name?: string, email?: string, phone?: string } = {}) {
        return client.get<CompanyDriverSetting[]>('/company/drivers', { params: filters });
    },

    /**
     * Get driver details
     */
    async getDriver(driverId: string) {
        return client.get<any>(`/company/drivers/${driverId}`);
    },

    /**
     * Invite a new driver by phone
     */
    async inviteDriver(phone: string) {
        return client.post<any>('/company/drivers/invite', { phone });
    },

    /**
     * Get available document types
     */
    async getDocumentTypes() {
        return client.get<any[]>('/document-types');
    },

    /**
     * Step 3: Set required documents for a driver
     */
    async setRequiredDocs(driverId: string, docTypeIds: string[]) {
        return client.post(`/company/drivers/${driverId}/required-docs`, { docTypeIds });
    },

    /**
     * Step 6: Validate an individual document
     */
    async validateDocument(fileId: string, status: 'APPROVED' | 'REJECTED', comment?: string) {
        return client.post(`/company/documents/${fileId}/validate`, { status, comment });
    },

    /**
     * Step 7: Send final fleet invitation
     */
    async inviteToFleet(driverId: string) {
        return client.post(`/company/drivers/${driverId}/invite-to-fleet`);
    }
};
