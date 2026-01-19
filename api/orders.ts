import client from "./client";
import { Address } from "./types";

export interface OrderPayload {
    pickup: Address;
    dropoff: Address;
    package_infos?: {
        name: string;
        description?: string;
        quantity: number;
        dimensions?: {
            weight_g?: number;
            width_cm?: number;
            height_cm?: number;
            length_cm?: number;
        };
        mention_warning?: 'fragile' | 'liquid' | 'flammable' | 'none';
    }[];
    ref_id?: string;
    assignment_mode?: 'GLOBAL' | 'INTERNAL' | 'TARGET';
    priority?: 'low' | 'medium' | 'high';
    note?: string;
}

export interface Order {
    id: string;
    refId?: string;
    assignmentMode: 'GLOBAL' | 'INTERNAL' | 'TARGET';
    status: string;
    pickupAddress: Address;
    deliveryAddress: Address;
    driverId?: string;
    pricingData: any;
    createdAt: string;
}

export const ordersApi = {
    create: async (payload: OrderPayload) => {
        const response = await client.post<{ order: Order }>('/orders', payload);
        return response.data;
    },

    list: async () => {
        const response = await client.get<Order[]>('/orders');
        return response.data;
    },

    get: async (id: string) => {
        const response = await client.get<Order>(`/orders/${id}`);
        return response.data;
    }
};
