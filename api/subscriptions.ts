import client from './client';

export interface SubscriptionRates {
    activityType: string;
    baseAmount: number;
    commandeCommissionPercent: number;
    ticketFeePercent: number;
    taxPercent: number;
    currency: string;
    source: {
        planId: string;
        overrideId: string | null;
    };
}

export interface SubscriptionUsage {
    month: string;
    usage: {
        commandeUsageAmount: number;
        ticketUsageAmount: number;
        commandeOrderCount: number;
        voyageOrderCount: number;
    };
}

export interface SubscriptionInvoice {
    id: string;
    companyId: string;
    activityTypeSnapshot: string;
    periodStart: string;
    periodEnd: string;
    baseAmount: number;
    commandeCommissionPercent: number;
    ticketFeePercent: number;
    taxPercent: number;
    currency: string;
    commandeUsageAmount: number;
    ticketUsageAmount: number;
    commandeCommissionAmount: number;
    ticketFeeAmount: number;
    totalAmount: number;
    taxAmount: number;
    totalAmountWithTax: number;
    status: 'ISSUED' | 'PAID' | 'OVERDUE';
    issuedAt: string | null;
    dueAt: string | null;
    paidAt: string | null;
    metadata?: any;
}

export const subscriptionsService = {
    async getEffectiveRates(): Promise<SubscriptionRates> {
        const { data } = await client.get<SubscriptionRates>('/company/subscription/effective');
        return data;
    },

    async getInvoices(params?: { status?: string, limit?: number }): Promise<SubscriptionInvoice[]> {
        const { data } = await client.get<SubscriptionInvoice[]>('/company/subscription/invoices', { params });
        return data;
    },

    async getUsage(): Promise<SubscriptionUsage> {
        const { data } = await client.get<SubscriptionUsage>('/company/subscription/usage');
        return data;
    },

    async changePlan(activityType: string): Promise<any> {
        const { data } = await client.post('/company/subscription/change-plan', { activityType });
        return data;
    }
};
