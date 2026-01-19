import client from './client';
import { Company, Address, Schedule } from './types';

export const companyService = {
    /**
     * Get company profile
     */
    async getProfile(companyId: string) {
        // Assuming we can fetch company details
        // Backend: GET /companies/:id
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
    }
};
