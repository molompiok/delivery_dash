import { User, Vehicle } from './types';

export interface Order {
    id: string;
    customerName: string;
    pickupAddress: string;
    deliveryAddress: string;
    status: 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED';
    price: number;
    createdAt: string;
    driverId?: string;
}

export interface Zone {
    id: string;
    ownerType: 'Company' | 'User' | 'Sublymus';
    ownerId: string | null;
    sourceZoneId?: string | null;  // ID de la zone Sublymus source si importée
    name: string;
    color: string;
    type: 'circle' | 'polygon' | 'rectangle';
    geometry: {
        radiusKm?: number;
        center?: { lat: number, lng: number };
        paths?: { lat: number, lng: number }[];
        bounds?: {
            north: number;
            south: number;
            east: number;
            west: number;
        };
    };
    sector?: string;
    assignedDriverIds?: string[];
    drivers?: Array<{ id: string }>;
    isActive: boolean;
}

export interface PricingRule {
    id: string;
    name: string;
    basePrice: number;
    perKmSurcharge: number;
    active: boolean;
}

export interface DriverPosition {
    driverId: string;
    vehicleId: string;
    lat: number;
    lng: number;
    heading: number;
    speed: number;
    // Enhanced fields
    status: 'PAUSE' | 'ONLINE' | 'BUSY';
    ordersInProgress: number;
}

export interface Driver {
    id: string;
    firstName: string;
    lastName: string;
    photo?: string; // URL
    status: 'PAUSE' | 'ONLINE' | 'BUSY';
    ordersInProgress: number;
    mileage: number; // km today
}

const mockOrders: Order[] = Array.from({ length: 15 }).map((_, i) => ({
    id: `ORD-${2023000 + i}`,
    customerName: ['Alice Traoré', 'Moussa Koné', 'Restaurant Le Délice', 'Boutique Zara', 'Jean Kouassi'][Math.floor(Math.random() * 5)],
    pickupAddress: 'Zone 4, Rue du Dr Blanchard',
    deliveryAddress: 'Cocody, Riviera 2',
    status: ['PENDING', 'ASSIGNED', 'DELIVERED'][Math.floor(Math.random() * 3)] as any,
    price: Math.floor(Math.random() * 5000) + 1000,
    createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    driverId: Math.random() > 0.5 ? 'driver-1' : undefined
}));

const mockZones: Zone[] = [
    { id: 'Z1', ownerType: 'Company', ownerId: 'C1', name: 'Cocody Centre', color: '#10b981', type: 'circle', geometry: { radiusKm: 4, center: { lat: 5.359, lng: -3.984 } }, sector: 'ABIDJAN', assignedDriverIds: ['driver-1', 'driver-2'], isActive: true },
    { id: 'Z2', ownerType: 'Company', ownerId: 'C1', name: 'Plateau Business', color: '#3b82f6', type: 'circle', geometry: { radiusKm: 2, center: { lat: 5.321, lng: -4.018 } }, sector: 'ABIDJAN', assignedDriverIds: ['driver-3'], isActive: true },
    { id: 'Z3', ownerType: 'Company', ownerId: 'C1', name: 'Marcory Zone 4', color: '#f59e0b', type: 'circle', geometry: { radiusKm: 3, center: { lat: 5.303, lng: -3.996 } }, sector: 'ABIDJAN', assignedDriverIds: [], isActive: true },
    { id: 'Z4', ownerType: 'Company', ownerId: 'C1', name: 'Yopougon Ind.', color: '#ef4444', type: 'circle', geometry: { radiusKm: 6, center: { lat: 5.341, lng: -4.084 } }, sector: 'ABIDJAN', assignedDriverIds: ['driver-4', 'driver-5'], isActive: true },
    { id: 'Z5', ownerType: 'User', ownerId: 'driver-1', name: 'Zone Perso Jean', color: '#8b5cf6', type: 'circle', geometry: { radiusKm: 2.5, center: { lat: 5.309, lng: -4.019 } }, sector: 'ABIDJAN', assignedDriverIds: [], isActive: true },
    { id: 'Z6', ownerType: 'Company', ownerId: 'C1', name: 'Centre Ville', color: '#ec4899', type: 'circle', geometry: { radiusKm: 3, center: { lat: 6.820, lng: -5.276 } }, sector: 'YAMOUSSOUKRO', assignedDriverIds: ['driver-6'], isActive: false },
];

const mockPricing: PricingRule[] = [
    { id: 'P1', name: 'Standard Delivery', basePrice: 1000, perKmSurcharge: 100, active: true },
    { id: 'P2', name: 'Express', basePrice: 2500, perKmSurcharge: 150, active: true },
    { id: 'P3', name: 'Night Shift', basePrice: 5000, perKmSurcharge: 200, active: false },
];

import { driverService } from './drivers';
import { zoneService } from './zones';

export const mockService = {
    async getOrders() {
        await new Promise(r => setTimeout(r, 400));
        return [...mockOrders];
    },

    async getZones() {
        try {
            const zones = await zoneService.list();
            return zones.map((z: any) => ({
                ...z,
                // Ensure assignedDriverIds is populated from the preloaded 'drivers' relation if missing
                assignedDriverIds: z.assignedDriverIds || z.drivers?.map((d: any) => d.id) || []
            }));
        } catch (error) {
            console.error('Failed to fetch real zones, falling back to mock:', error);
            return [...mockZones];
        }
    },

    async getPricingRules() {
        await new Promise(r => setTimeout(r, 300));
        return [...mockPricing];
    },

    async getDriverPositions(): Promise<DriverPosition[]> {
        let driverIds: string[] = [];
        try {
            const drivers = await this.getDrivers();
            driverIds = drivers.map(d => d.id);
        } catch (e) {
            driverIds = Array.from({ length: 8 }).map((_, i) => `driver-${i + 1}`);
        }

        // Return positions for the first 8 drivers found
        return driverIds.slice(0, 8).map((id, i) => ({
            driverId: id,
            vehicleId: `vhc-${i}`,
            lat: 5.340 + (Math.random() * 0.08 - 0.04),
            lng: -4.010 + (Math.random() * 0.08 - 0.04),
            heading: Math.random() * 360,
            speed: Math.floor(Math.random() * 60),
            status: ['ONLINE', 'ONLINE', 'ONLINE', 'BUSY', 'BUSY', 'PAUSE'][Math.floor(Math.random() * 6)] as any,
            ordersInProgress: Math.floor(Math.random() * 3)
        }));
    },

    async getDrivers(): Promise<Driver[]> {
        try {
            const { data } = await driverService.listDrivers();
            // Map CompanyDriverSetting to Driver
            return data.map(cds => {
                const d = cds.driver || {};
                const name = d.fullName || '';
                return {
                    id: d.id || cds.driverId,
                    firstName: name.split(' ')[0] || 'Chauffeur',
                    lastName: name.split(' ').slice(1).join(' ') || (d.id ? `(#${d.id.slice(-4)})` : ''),
                    status: 'ONLINE', // Fallback
                    ordersInProgress: 0,
                    mileage: 0
                };
            });
        } catch (error) {
            console.error('Failed to fetch real drivers, falling back to mock:', error);
            const names = [
                { f: 'Amadou', l: 'Koné' }, { f: 'Jean', l: 'Kouassi' }, { f: 'Moussa', l: 'Sidibé' },
                { f: 'Ismael', l: 'Traoré' }, { f: 'Yao', l: 'Koffi' }, { f: 'Ibrahim', l: 'Diallo' },
                { f: 'Seydou', l: 'Keita' }, { f: 'Bakary', l: 'Sako' }
            ];
            return Array.from({ length: 8 }).map((_, i) => ({
                id: `driver-${i + 1}`,
                firstName: names[i].f,
                lastName: names[i].l,
                status: ['ONLINE', 'ONLINE', 'ONLINE', 'BUSY', 'BUSY', 'PAUSE'][Math.floor(Math.random() * 6)] as any,
                ordersInProgress: Math.floor(Math.random() * 3),
                mileage: Math.floor(Math.random() * 120) + 10
            }));
        }
    },

    async getDriverOrders(driverId: string): Promise<Order[]> {
        await new Promise(r => setTimeout(r, 400));
        return mockOrders.filter(o => o.driverId === driverId || Math.random() > 0.8).map(o => ({
            ...o,
            driverId
        }));
    },

    async getVehicles(): Promise<Vehicle[]> {
        try {
            const userStr = localStorage.getItem('delivery_user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user.companyId) {
                    const { fleetService } = await import('./fleet');
                    const { data } = await fleetService.listVehicles(user.companyId);
                    return data;
                }
            }
            return [];
        } catch (error) {
            console.error('Failed to fetch real vehicles:', error);
            return [];
        }
    }
};
