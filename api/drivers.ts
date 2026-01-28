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
    async validateDocument(docId: string, status: 'APPROVED' | 'REJECTED', comment?: string) {
        return client.post(`/company/documents/${docId}/validate`, { status, comment });
    },

    /**
     * Upload an ETP document for a driver relationship
     */
    async uploadCompanyDoc(relationId: string, docType: string, file: File) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('docType', docType);
        return client.post(`/company/drivers/relation/${relationId}/documents/upload`, formData);
    },

    /**
     * Step 7: Send final fleet invitation
     */
    async inviteToFleet(driverId: string) {
        return client.post(`/company/drivers/${driverId}/invite-to-fleet`);
    },

    /**
     * Sync driver requirements with company standards
     */
    async syncRequirements(driverId: string) {
        return client.post(`/company/drivers/${driverId}/sync-requirements`);
    }
};
