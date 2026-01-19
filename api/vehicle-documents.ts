import { apiClient } from './client'

export interface VehicleDocument {
    id: string
    documentType: 'VEHICLE_INSURANCE' | 'VEHICLE_TECHNICAL_VISIT' | 'VEHICLE_REGISTRATION'
    fileId: string | null
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    validationComment: string | null
    expireAt: string | null
    isDeleted: boolean
    metadata: {
        history?: Array<{
            timestamp: string
            action: string
            actorId: string
            actorTable: string
            [key: string]: any
        }>
    }
    createdAt: string
    updatedAt: string
    file?: {
        id: string
        name: string
        path: string
        mimeType: string
        size: number
    }
}

export interface UploadVehicleDocumentRequest {
    docType: 'VEHICLE_INSURANCE' | 'VEHICLE_TECHNICAL_VISIT' | 'VEHICLE_REGISTRATION'
    file: File
    expiryDate?: string
}

export interface ValidateVehicleDocumentRequest {
    status: 'APPROVED' | 'REJECTED'
    comment?: string
}

export const vehicleDocumentsApi = {
    /**
     * Upload a document for a vehicle
     */
    async upload(vehicleId: string, data: UploadVehicleDocumentRequest) {
        const formData = new FormData()
        formData.append('file', data.file)
        formData.append('docType', data.docType)
        if (data.expiryDate) {
            formData.append('expiryDate', data.expiryDate)
        }

        const response = await apiClient.post(`/v1/vehicles/${vehicleId}/documents`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        return response.data
    },

    /**
     * Validate a vehicle document (Admin only)
     */
    async validate(docId: string, data: ValidateVehicleDocumentRequest) {
        const response = await apiClient.post(`/v1/vehicle-documents/${docId}/validate`, data)
        return response.data
    },

    /**
     * Get all documents for a vehicle
     */
    async list(vehicleId: string): Promise<VehicleDocument[]> {
        const response = await apiClient.get(`/v1/files/Vehicle/${vehicleId}`)
        return response.data
    },

    /**
     * Delete a vehicle document
     */
    async delete(fileId: string) {
        const response = await apiClient.delete(`/v1/files/${fileId}`)
        return response.data
    },

    /**
     * Download a vehicle document
     */
    getDownloadUrl(fileId: string): string {
        return `${apiClient.defaults.baseURL}/v1/files/${fileId}/download`
    },

    /**
     * View a vehicle document (inline)
     */
    getViewUrl(fileId: string): string {
        return `${apiClient.defaults.baseURL}/v1/files/${fileId}/view`
    },
}
