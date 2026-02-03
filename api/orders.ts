import client from "./client";
import { Address } from "./types";

// --- API Response Types with Validation ---
export interface ValidationIssue {
    path: string;           // e.g. "steps[0].stops[1].actions[0]"
    type: 'warning' | 'error';
    message: string;
    code?: string;
}

export interface ApiResponse<T> {
    data: T;
    entity?: T; // For granular operations returning a single entity
    warnings?: ValidationIssue[];
    errors?: ValidationIssue[];
}

// --- Action Types ---
export interface Action {
    id: string;
    type: 'PICKUP' | 'DELIVERY' | 'SERVICE';
    transitItemId?: string;
    transitItem?: {
        id: string;
        name: string;
        description?: string;
        product_url?: string;
        packaging_type?: 'box' | 'fluid';
        weight_g?: number; // unified in grams
        unitary_price?: number;
        dimensions?: {
            width_cm?: number;
            height_cm?: number;
            depth_cm?: number;
            volume_l?: number;
        };
        requirements?: string[];
        metadata?: any;
    };
    quantity: number;
    serviceTime: number; // in seconds
    status: string;
    isPendingChange?: boolean;
    isDeleteRequired?: boolean;
    originalId?: string;
    metadata?: any;
    confirmationRules?: {
        photo?: Array<{ name: string; pickup: boolean; delivery: boolean; compare: boolean; reference?: string }>;
        code?: Array<{ name: string; pickup: boolean; delivery: boolean; compare: boolean; reference?: string }>;
    };
}

export interface ActionPayload {
    type: 'pickup' | 'delivery' | 'service';
    transit_item_id?: string;
    quantity?: number;
    service_time?: number; // in seconds
    confirmation_rules?: any;
    metadata?: any;
}

// --- Stop Types ---
export interface Stop {
    id: string;
    sequence: number;
    addressId?: string;
    address: {
        id?: string;
        label?: string;
        formattedAddress?: string;
        street?: string;
        city?: string;
        country?: string;
        lat?: number;
        lng?: number;
        call?: string;
        room?: string;
        stage?: string;
    };
    client?: {
        name?: string;
        avatar?: string;
        email?: string;
        phone?: string;
        clientId?: string;
        opening_hours?: {
            start?: string;
            end?: string;
            duration?: number;
        };
    };
    arrivalWindowStart?: string;
    arrivalWindowEnd?: string;
    actions: Action[];
    isPendingChange?: boolean;
    isDeleteRequired?: boolean;
    originalId?: string;
    metadata?: any;
}

export interface StopPayload {
    address_text?: string;
    coordinates?: [number, number];
    arrival_window_start?: string;
    arrival_window_end?: string;
    actions?: ActionPayload[];
    metadata?: any;
}

// --- Step Types ---
export interface Step {
    id: string;
    sequence: number;
    linked: boolean;
    stops: Stop[];
    isPendingChange?: boolean;
    originalId?: string;
}

export interface StepPayload {
    name?: string;
    linked?: boolean;
    sequence?: number;
}

// --- Hierarchical Order Payload (for bulk creation) ---
export interface HierarchicalOrderPayload {
    steps: Array<{
        sequence: number;
        linked: boolean;
        stops: Array<{
            address_text: string;
            coordinates?: [number, number];
            sequence: number;
            actions: ActionPayload[];
        }>;
    }>;
    transit_items?: any[];
    assignment_mode?: 'GLOBAL' | 'INTERNAL' | 'TARGET';
    ref_id?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

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
    steps: Step[];
    statusHistory?: Array<{ status: string; timestamp: string; label?: string; note?: string; current?: boolean; done?: boolean; pending?: boolean }>;
    createdAt: string;
    packages?: any[];
    tasks?: any[];
    shipments?: any[];
    jobs?: any[];
    totalDistanceMeters?: number;
    totalDurationSeconds?: number;
    transitItems: NonNullable<Action['transitItem']>[];
}

export const ordersApi = {
    // --- Order CRUD ---
    create: async (payload: OrderPayload | HierarchicalOrderPayload) => {
        const response = await client.post<{ order: Order; warnings?: ValidationIssue[] }>('/orders', payload);
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

    update: async (id: string, payload: any) => {
        const response = await client.put<{ order: Order; warnings?: ValidationIssue[] }>(`/orders/${id}`, payload);
        return response.data;
    },

    addItem: async (id: string, payload: any) => {
        const response = await client.post<any>(`/orders/${id}/items`, payload);
        return response.data;
    },

    updateItem: async (id: string, payload: any) => {
        const response = await client.patch<any>(`/items/${id}`, payload);
        return response.data;
    },

    // --- Order Lifecycle ---
    initiate: async () => {
        const response = await client.post<{ order: Order; message: string }>('/orders/initiate');
        return response.data;
    },

    submit: async (id: string) => {
        const response = await client.post<{ order: Order; message: string }>(`/orders/${id}/submit`);
        return response.data;
    },

    pushUpdates: async (id: string) => {
        const response = await client.post<{ order: Order; message: string }>(`/orders/${id}/push-updates`);
        return response.data;
    },

    // --- Step Operations ---
    addStep: async (orderId: string, payload: StepPayload, options?: { recalculate?: boolean }) => {
        const params = options?.recalculate ? '?recalculate=true' : '';
        const response = await client.post<{ step: Step; validationErrors?: ValidationIssue[] }>(
            `/orders/${orderId}/steps${params}`,
            payload
        );
        return response.data;
    },

    updateStep: async (stepId: string, payload: StepPayload, options?: { recalculate?: boolean }) => {
        const params = options?.recalculate ? '?recalculate=true' : '';
        const response = await client.patch<{ step: Step; validationErrors?: ValidationIssue[] }>(
            `/steps/${stepId}${params}`,
            payload
        );
        return response.data;
    },

    removeStep: async (stepId: string, options?: { recalculate?: boolean }) => {
        const params = options?.recalculate ? '?recalculate=true' : '';
        const response = await client.delete<{ message: string }>(`/steps/${stepId}${params}`);
        return response.data;
    },

    // --- Stop Operations ---
    addStop: async (stepId: string, payload: StopPayload, options?: { recalculate?: boolean }) => {
        const params = options?.recalculate ? '?recalculate=true' : '';
        const response = await client.post<{ stop: Stop; entity?: Stop; validationErrors?: ValidationIssue[] }>(
            `/steps/${stepId}/stops${params}`,
            payload
        );
        return response.data;
    },

    updateStop: async (stopId: string, payload: StopPayload, options?: { recalculate?: boolean }) => {
        const params = options?.recalculate ? '?recalculate=true' : '';
        const response = await client.patch<{ stop: Stop; entity?: Stop; validationErrors?: ValidationIssue[] }>(
            `/stops/${stopId}${params}`,
            payload
        );
        return response.data;
    },

    removeStop: async (stopId: string, options?: { recalculate?: boolean }) => {
        const params = options?.recalculate ? '?recalculate=true' : '';
        const response = await client.delete<{ message: string }>(`/stops/${stopId}${params}`);
        return response.data;
    },

    // --- Action Operations ---
    addAction: async (stopId: string, payload: ActionPayload, options?: { recalculate?: boolean }) => {
        const params = options?.recalculate ? '?recalculate=true' : '';
        const response = await client.post<{ action: Action; validationErrors?: ValidationIssue[] }>(
            `/stops/${stopId}/actions${params}`,
            payload
        );
        return response.data;
    },

    updateAction: async (actionId: string, payload: ActionPayload, options?: { recalculate?: boolean }) => {
        const params = options?.recalculate ? '?recalculate=true' : '';
        const response = await client.patch<{ action: Action; validationErrors?: ValidationIssue[] }>(
            `/actions/${actionId}${params}`,
            payload
        );
        return response.data;
    },

    removeAction: async (actionId: string, options?: { recalculate?: boolean }) => {
        const params = options?.recalculate ? '?recalculate=true' : '';
        const response = await client.delete<{ message: string }>(`/actions/${actionId}${params}`);
        return response.data;
    },
};
