import client from "./client";
import { Address } from "./types";

export interface ComplexOrderPayload {
    shipments?: Array<{
        pickup: {
            address_text: string;
            coordinates: [number, number];
            service_time?: number;
        };
        delivery: {
            address_text: string;
            coordinates: [number, number];
            service_time?: number;
        };
        package?: {
            name: string;
            weight?: number;
        };
    }>;
    jobs?: Array<{
        address_text: string;
        coordinates: [number, number];
        service_time?: number;
    }>;
    ref_id?: string;
    assignment_mode?: 'GLOBAL' | 'INTERNAL' | 'TARGET';
    logic_pattern?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface MultiDropWaypoint {
    address_text: string;
    type: 'pickup' | 'delivery';
    waypoint_sequence?: number;
    coordinates?: [number, number];
}

export interface OrderPayload {
    waypoints: MultiDropWaypoint[];
    ref_id?: string;
    assignment_mode?: 'GLOBAL' | 'INTERNAL' | 'TARGET';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    optimize_route?: boolean;
}

export interface Order {
    id: string;
    refId?: string;
    assignmentMode: 'GLOBAL' | 'INTERNAL' | 'TARGET';
    status: string;
    isComplex?: boolean;
    pickupAddress: Address;
    deliveryAddress: Address;
    driverId?: string;
    driver?: {
        name: string;
        phone: string;
        rating?: number;
        vehicle?: { type: string; plate: string; color?: string };
        driverSetting?: {
            currentLat: number | null;
            currentLng: number | null;
            status: string;
        };
    };
    pricingData: any;
    routeGeometry?: { type: 'LineString'; coordinates: number[][] };
    legs: any[];
    statusHistory?: Array<{ status: string; timestamp: string; label?: string; note?: string; current?: boolean; done?: boolean; pending?: boolean }>;
    createdAt: string;
    packages?: any[];
    tasks?: any[];
    shipments?: any[];
    jobs?: any[];
    totalDistanceMeters?: number;
    totalDurationSeconds?: number;
}

export const ordersApi = {
    create: async (payload: OrderPayload) => {
        const response = await client.post<{ order: Order }>('/orders', payload);
        return response.data;
    },

    createComplex: async (payload: ComplexOrderPayload) => {
        const response = await client.post<{ order: Order }>('/orders/complex', payload);
        return response.data;
    },

    estimate: async (payload: OrderPayload) => {
        const response = await client.post<any>('/orders/estimate', payload);
        return response.data;
    },

    list: async () => {
        const response = await client.get<Order[]>('/orders');
        return response.data;
    },

    initiate: async () => {
        const response = await client.post<{ order: Order }>('/orders/initiate');
        return response.data;
    },

    submit: async (id: string) => {
        const response = await client.post<{ order: Order }>(`/orders/${id}/submit`);
        return response.data;
    },

    update: async (id: string, payload: any) => {
        const response = await client.put<{ order: Order }>(`/orders/${id}`, payload);
        return response.data;
    },

    get: async (id: string) => {
        const response = await client.get<Order>(`/orders/${id}`);
        return response.data;
    }
};
