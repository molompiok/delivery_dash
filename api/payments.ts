import client from './client';
import { PricingFilter } from './types';

export const paymentsService = {
    /**
     * Get pricing filters for the company
     */
    async getPricingFilters() {
        const { data } = await client.get<PricingFilter[]>('/pricing-filters');
        return data;
    },

    /**
     * Create a new pricing filter
     */
    async createPricingFilter(filter: Partial<PricingFilter>) {
        const { data } = await client.post<PricingFilter>('/pricing-filters', filter);
        return data;
    },

    /**
     * Update an existing pricing filter
     */
    async updatePricingFilter(id: string, filter: Partial<PricingFilter>) {
        const { data } = await client.patch<PricingFilter>(`/pricing-filters/${id}`, filter);
        return data;
    },

    /**
     * Delete a pricing filter
     */
    async deletePricingFilter(id: string) {
        const { data } = await client.delete(`/pricing-filters/${id}`);
        return data;
    }
};
