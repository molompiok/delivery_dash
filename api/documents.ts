import client from './client';
import { FileRecord } from './types';

export const documentService = {
    // List company files
    async listCompanyFiles() {
        // GET /v1/company/files
        return client.get<FileRecord[]>('/company/files');
    },

    // Upload a document
    async uploadDocument(file: File, docType: string) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('docType', docType);

        return client.post<FileRecord>('/company/documents/upload', formData);
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
