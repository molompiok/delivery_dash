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

export interface HierarchicalOrderPayload {
    steps: Array<{
        sequence?: number;
        linked?: boolean;
        stops: Array<{
            address_text: string;
            coordinates?: [number, number];
            sequence?: number;
            actions: Array<{
                type: 'pickup' | 'delivery' | 'service';
                transit_item_id?: string;
                quantity?: number;
                service_time?: number;
                confirmation_rules?: {
                    otp?: boolean;
                    photo?: boolean;
                    signature?: boolean;
                    scan?: boolean;
                };
                metadata?: any;
            }>;
        }>;
    }>;
    transit_items: Array<{
        id: string;
        product_id?: string;
        name: string;
        description?: string;
        packaging_type?: 'box' | 'fluid';
        weight_g?: number;
        dimensions?: {
            width_cm?: number;
            height_cm?: number;
            length_cm?: number;
        };
        unitary_price?: number;
        metadata?: any;
    }>;
    ref_id?: string;
    assignment_mode?: 'GLOBAL' | 'INTERNAL' | 'TARGET';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface OrderPayload {
    waypoints: MultiDropWaypoint[];
    ref_id?: string;
    assignment_mode?: 'GLOBAL' | 'INTERNAL' | 'TARGET';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    optimize_route?: boolean;
}

export interface Step {
    id: string;
    sequence: number;
    linked: boolean;
    status: string;
    metadata?: any;
    originalId?: string;
    isPendingChange?: boolean;
    isDeleteRequired?: boolean;
    stops: Stop[];
}

export interface Stop {
    id: string;
    addressId: string;
    sequence: number;
    arrivalWindowStart?: string;
    arrivalWindowEnd?: string;
    metadata?: any;
    originalId?: string;
    isPendingChange?: boolean;
    isDeleteRequired?: boolean;
    address: Address;
    actions: Action[];
}

export interface Action {
    id: string;
    type: 'PICKUP' | 'DELIVERY' | 'SERVICE';
    transitItemId?: string;
    quantity: number;
    serviceTime: number;
    status: string;
    metadata?: any;
    originalId?: string;
    isPendingChange?: boolean;
    isDeleteRequired?: boolean;
    transitItem?: TransitItem;
}

export interface TransitItem {
    id: string;
    name: string;
    weight?: number;
    metadata?: any;
}

export interface Order {
    id: string;
    refId?: string;
    assignmentMode: 'GLOBAL' | 'INTERNAL' | 'TARGET';
    status: string;
    isComplex?: boolean;
    pickupAddress: Address; // Legacy
    deliveryAddress: Address; // Legacy
    driverId?: string;
    driver?: {
        name: string;
        phone: string;
        fullName?: string;
        rating?: number;
        vehicle?: { type: string; plate: string; color?: string };
        driverSetting?: {
            currentLat: number | null;
            currentLng: number | null;
            status: string;
        };
    };
    steps: Step[];
    transitItems: TransitItem[];
    pricingData: any;
    routeGeometry?: { type: 'LineString'; coordinates: number[][] };
    legs: any[];
    statusHistory?: Array<{ status: string; timestamp: string; label?: string; note?: string; current?: boolean; done?: boolean; pending?: boolean }>;
    createdAt: string;
    totalDistanceMeters?: number;
    totalDurationSeconds?: number;
    validationErrors?: LogisticsValidationError[];
}

export interface LogisticsValidationError {
    path: string;
    message: string;
}

export const ordersApi = {
    create: async (payload: OrderPayload | HierarchicalOrderPayload) => {
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

    get: async (id: string) => {
        const response = await client.get<Order>(`/orders/${id}`);
        return response.data;
    },

    // --- Atomic Creation Methods ---
    initiate: async (data: any = {}) => {
        const response = await client.post<Order>('/orders/initiate', data);
        return response.data;
    },

    submit: async (id: string) => {
        const response = await client.post<Order>(`/orders/${id}/submit`);
        return response.data;
    },

    pushUpdates: async (id: string) => {
        const response = await client.post<Order>(`/orders/${id}/push-updates`);
        return response.data;
    },

    estimateDraft: async (id: string) => {
        const response = await client.get<any>(`/orders/${id}/estimate-draft`);
        return response.data;
    },

    // Steps
    addStep: async (orderId: string, data: any, options: { recalculate?: boolean } = {}) => {
        const response = await client.post<any>(`/orders/${orderId}/steps`, data, { params: options });
        return response.data;
    },
    updateStep: async (stepId: string, data: any, options: { recalculate?: boolean } = {}) => {
        const response = await client.put<any>(`/steps/${stepId}`, data, { params: options });
        return response.data;
    },
    removeStep: async (stepId: string, options: { recalculate?: boolean } = {}) => {
        const response = await client.delete<any>(`/steps/${stepId}`, { params: options });
        return response.data;
    },

    // Stops
    addStop: async (stepId: string, data: any, options: { recalculate?: boolean } = {}) => {
        const response = await client.post<any>(`/steps/${stepId}/stops`, data, { params: options });
        return response.data;
    },
    updateStop: async (stopId: string, data: any, options: { recalculate?: boolean } = {}) => {
        const response = await client.put<any>(`/stops/${stopId}`, data, { params: options });
        return response.data;
    },
    removeStop: async (stopId: string, options: { recalculate?: boolean } = {}) => {
        const response = await client.delete<any>(`/stops/${stopId}`, { params: options });
        return response.data;
    },

    // Actions
    addAction: async (stopId: string, data: any, options: { recalculate?: boolean } = {}) => {
        const response = await client.post<any>(`/stops/${stopId}/actions`, data, { params: options });
        return response.data;
    },
    updateAction: async (actionId: string, data: any, options: { recalculate?: boolean } = {}) => {
        const response = await client.put<any>(`/actions/${actionId}`, data, { params: options });
        return response.data;
    },
    removeAction: async (actionId: string, options: { recalculate?: boolean } = {}) => {
        const response = await client.delete<any>(`/actions/${actionId}`, { params: options });
        return response.data;
    },

    // Transit Items
    addTransitItem: async (orderId: string, data: any) => {
        const response = await client.post<any>(`/orders/${orderId}/items`, data);
        return response.data;
    }
};
