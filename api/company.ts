import client from './client';
import { Company, Address, Schedule } from './types';

export const companyService = {
    /**
     * Get company profile
     */
    async getProfile(companyId?: string) {
        // If no ID provided, get authenticated user's company
        if (!companyId) return client.get<Company>('/company/me');
        return client.get<Company>(`/companies/${companyId}`);
    },

    /**
     * Get Company Addresses
     */
    async getAddresses(companyId: string) {
        return client.get<Address[]>('/addresses', {
            params: {
                ownerType: 'Company',
                ownerId: companyId
            }
        });
    },

    /**
     * Create Address
     */
    async createAddress(companyId: string, address: Partial<Address>) {
        return client.post<Address>('/addresses', {
            ...address,
            ownerType: 'Company',
            ownerId: companyId
        });
    },

    /**
     * Set Default Address
     */
    async setDefaultAddress(addressId: string) {
        return client.post(`/addresses/${addressId}/set-default`);
    },

    /**
     * Get Company Schedules
     */
    async getSchedules(companyId: string) {
        return client.get<Schedule[]>('/schedules', {
            params: {
                ownerType: 'Company',
                ownerId: companyId
            }
        });
    },

    /**
     * Get Company Document Requirements
     */
    async getRequirements() {
        return client.get<any[]>('/company/requirements');
    },

    /**
     * Update Company Document Requirements
     */
    async updateRequirements(requirements: any[]) {
        return client.post<any[]>('/company/requirements', { requirements });
    },

    /**
     * Create a new company
     */
    async create(data: { name: string, activityType: string, registreCommerce?: string, logo?: string, description?: string }) {
        return client.post<Company>('/company', data);
    },

    /**
     * Update company
     */
    async updateCompany(data: Partial<Company> | FormData) {
        return client.put<Company>('/company', data);
    }
};
