import client from './client';
import { FileRecord } from './types';

// Base URL for file access
const getFileBaseUrl = () => {
    if ((import.meta as any).env?.VITE_API_URL) return (import.meta as any).env.VITE_API_URL.replace('/v1', '');
    if (typeof window !== 'undefined') {
        return `http://${window.location.hostname}:3333`;
    }
    return 'http://localhost:3333';
};

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
    },

    /**
     * Get a file URL for viewing (public or session-based)
     */
    getFileUrl(filename: string) {
        if (!filename) return '';
        // Extract just the filename if it starts with 'fs/'
        const cleanFilename = filename.startsWith('fs/') ? filename.substring(3) : filename;
        return `${getFileBaseUrl()}/fs/${cleanFilename}`;
    },

    /**
     * View a document by requesting a temporary signed URL (for private files in new tabs)
     */
    async getSignedUrl(filename: string) {
        if (!filename) return '';
        // 1. Get just the filename (security)
        const cleanFilename = filename.startsWith('fs/') ? filename.substring(3) : filename;

        // 2. Fetch temporary token from server
        const { data } = await client.get<{ token: string }>(`/fs/token/${cleanFilename}`);

        // 3. Construct direct URL with token
        return `${getFileBaseUrl()}/fs/${cleanFilename}?token=${data.token}`;
    }
};
