import client from './client';
import { Wallet, Transaction, WalletStats } from './types';

export interface GetTransactionsParams {
    wallet_id?: string;
    start_date?: string;
    end_date?: string;
    category?: string;
    limit?: number;
    page?: number;
}

export interface PayoutEstimate {
    net_amount: number;
    fee_bps: number;
    estimated_fee: number;
    total_debit: number;
    wallet_id?: string;
    balance_available?: number;
    can_payout?: boolean;
    missing_amount?: number;
}

export const walletService = {
    /**
     * List all wallets accessible by the user (Personal + Managed Companies)
     */
    async listWallets() {
        const { data } = await client.get<Wallet[]>('/driver/payments/wallets');
        return data;
    },

    /**
     * Get transaction history with filters
     */
    async getTransactions(params: GetTransactionsParams) {
        const { data: rawData } = await client.get<{ data: any[], meta: any }>('/driver/payments/transactions', { params });

        // Normalize transaction data
        const transactions: Transaction[] = (rawData.data || []).map(tx => ({
            id: tx.id,
            wallet_id: tx.walletId || tx.wallet_id,
            amount: typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount,
            category: tx.category,
            label: tx.label,
            status: tx.status,
            external_reference: tx.externalReference || tx.external_reference,
            metadata: tx.metadata,
            created_at: tx.createdAt || tx.created_at,
            updated_at: tx.updatedAt || tx.updated_at,
            wallet: tx.wallet,
            type: tx.direction === 'CREDIT' ? 'IN' : 'OUT'
        }));

        return { data: transactions, meta: rawData.meta };
    },

    /**
     * Get wallet statistics for a specific period
     */
    async getStats(walletId: string, startDate?: string, endDate?: string) {
        const { data: rawData } = await client.get<any>('/driver/payments/stats', {
            params: { walletId, startDate, endDate }
        });

        // Normalize stats data (Wave API returns in/out, UI expects income/expense)
        const stats: WalletStats = {
            income: rawData.stats?.in || 0,
            expense: rawData.stats?.out || 0,
            net: rawData.stats?.net || 0,
            transaction_count: rawData.stats?.transaction_count || rawData.stats?.transactions_count || 0,
            by_category: rawData.stats?.by_category,
            daily: (rawData.daily || []).map((d: any) => ({
                date: d.date,
                income: d.in || 0,
                expense: d.out || 0,
                net: d.net || 0
            })),
            wallet: rawData.wallet
        };

        return stats;
    },

    /**
     * Initiate a deposit (recharge) via Wave Checkout
     */
    async deposit(payload: { walletId: string, amount: number, description?: string, success_url?: string, error_url?: string }) {
        const { data } = await client.post<any>('/driver/payments/deposit', payload);
        return data;
    },

    /**
     * Initiate a payout (withdraw) to a Wave phone number
     */
    async payout(payload: { walletId: string, amount: number, recipient_phone: string, recipient_name?: string }) {
        const { data } = await client.post<any>('/driver/payments/payout', payload);
        return data;
    },

    /**
     * Estimate payout fee and wallet debit requirement
     */
    async estimatePayout(payload: { walletId: string, amount: number }) {
        const { data } = await client.post<{ data: PayoutEstimate }>('/driver/payments/payout-estimate', payload);
        return data?.data;
    },

    /**
     * Transfer funds between two accessible wallets
     */
    async transfer(payload: { from_wallet_id: string, to_wallet_id: string, amount: number, label?: string }) {
        const { data } = await client.post<any>('/driver/payments/transfer', payload);
        return data;
    },

    /**
     * List potential transfer targets (Drivers + Managers)
     */
    async listTransferTargets() {
        const { data } = await client.get<any[]>('/driver/payments/transfer-targets');
        return data;
    }
};
