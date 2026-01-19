import client from './client';
import { FileRecord } from './types';

export const documentService = {
    // List company files
    async listCompanyFiles() {
        // GET /v1/company/files
        return client.get<FileRecord[]>('/company/files');
    },

    // Upload a document
    async uploadDocument(file: File, category: string, expiryDate?: string) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileCategory', category);
        formData.append('ownerType', 'Company');
        // ownerId is inferred from token in backend or should be passed?
        // Actually /v1/files/upload expects specific params?
        // Let's use the explicit generic upload if needed or the specific if available.
        // Checking backend routes: GET /v1/company/files exists.
        // POST /v1/files/upload exists.

        if (expiryDate) {
            formData.append('expiryDate', expiryDate);
        }

        return client.post<FileRecord>('/files/upload', formData);
    },

    async deleteFile(fileId: string) {
        return client.delete(`/files/${fileId}`);
    },

    // Get categories
    async getCategories() {
        return client.get<string[]>('/files/categories');
    },

    async getDocumentTypes() {
        return client.get<any[]>('/document-types');
    }
};
