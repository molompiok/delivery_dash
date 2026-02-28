import { User, Vehicle, Zone, CompanyDriverSetting } from './types';
export type { Zone };
import { Order } from './orders';
import { PricingRule } from './payments';



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

const mockOrders: any[] = Array.from({ length: 15 }).map((_, i) => ({
    id: `ord_${2023000 + i}`,
    refId: `REF-${2023000 + i}`,
    customerName: ['Alice Traoré', 'Moussa Koné', 'Restaurant Le Délice', 'Boutique Zara', 'Jean Kouassi'][Math.floor(Math.random() * 5)],
    pickupAddress: { formattedAddress: 'Zone 4, Rue du Dr Blanchard' },
    deliveryAddress: { formattedAddress: 'Cocody, Riviera 2' },
    status: ['PENDING', 'ACCEPTED', 'DELIVERED'][Math.floor(Math.random() * 3)],
    pricingData: { finalPrice: Math.floor(Math.random() * 5000) + 1000 },
    createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    driverId: Math.random() > 0.5 ? 'driver-1' : undefined,
    assignmentMode: 'GLOBAL'
}));

const mockZones: Zone[] = [
    { id: 'Z1', ownerType: 'Company', ownerId: 'C1', name: 'Cocody Centre', color: '#10b981', type: 'circle', geometry: { radiusKm: 4, center: { lat: 5.359, lng: -3.984 } }, sector: 'ABIDJAN', assignedDriverIds: ['driver-1', 'driver-2'], isActive: true },
    { id: 'Z2', ownerType: 'Company', ownerId: 'C1', name: 'Plateau Business', color: '#3b82f6', type: 'circle', geometry: { radiusKm: 2, center: { lat: 5.321, lng: -4.018 } }, sector: 'ABIDJAN', assignedDriverIds: ['driver-3'], isActive: true },
    { id: 'Z3', ownerType: 'Company', ownerId: 'C1', name: 'Marcory Zone 4', color: '#f59e0b', type: 'circle', geometry: { radiusKm: 3, center: { lat: 5.303, lng: -3.996 } }, sector: 'ABIDJAN', assignedDriverIds: [], isActive: true },
    { id: 'Z4', ownerType: 'Company', ownerId: 'C1', name: 'Yopougon Ind.', color: '#ef4444', type: 'circle', geometry: { radiusKm: 6, center: { lat: 5.341, lng: -4.084 } }, sector: 'ABIDJAN', assignedDriverIds: ['driver-4', 'driver-5'], isActive: true },
    { id: 'Z5', ownerType: 'User', ownerId: 'driver-1', name: 'Zone Perso Jean', color: '#8b5cf6', type: 'circle', geometry: { radiusKm: 2.5, center: { lat: 5.309, lng: -4.019 } }, sector: 'ABIDJAN', assignedDriverIds: [], isActive: true },
    { id: 'Z6', ownerType: 'Company', ownerId: 'C1', name: 'Centre Ville', color: '#ec4899', type: 'circle', geometry: { radiusKm: 3, center: { lat: 6.820, lng: -5.276 } }, sector: 'YAMOUSSOUKRO', assignedDriverIds: ['driver-6'], isActive: false },
];

import { PricingFilter } from './types';

const mockPricing: PricingFilter[] = [
    {
        id: 'P1',
        name: 'Tarif Standard - Mission',
        template: 'MISSION',
        baseFee: 1000,
        perKmRate: 150,
        minDistance: 2,
        maxDistance: null,
        perKgRate: 50,
        freeWeightKg: 5,
        perM3Rate: 200,
        fragileMultiplier: 1.2,
        urgentMultiplier: 1.5,
        nightMultiplier: 1.3,
        proximityDiscountPercent: 10,
        proximityThresholdKm: 2,
        heavyLoadSurchargeThresholdKg: 50,
        heavyLoadSurchargePercent: 15,
        lightLoadDiscountThresholdKg: 1,
        lightLoadDiscountPercent: 5,
        isActive: true,
        companyId: 'C1',
        driverId: null
    },
    {
        id: 'P2',
        name: 'Transport Voyage Longue Dist.',
        template: 'VOYAGE',
        baseFee: 5000,
        perKmRate: 120,
        minDistance: 50,
        maxDistance: null,
        perKgRate: 40,
        freeWeightKg: 20,
        perM3Rate: 150,
        fragileMultiplier: 1.1,
        urgentMultiplier: 1.2,
        nightMultiplier: 1.2,
        proximityDiscountPercent: 5,
        proximityThresholdKm: 5,
        heavyLoadSurchargeThresholdKg: 100,
        heavyLoadSurchargePercent: 10,
        lightLoadDiscountThresholdKg: 0,
        lightLoadDiscountPercent: 0,
        isActive: true,
        companyId: 'C1',
        driverId: null
    },
    {
        id: 'P3',
        name: 'Livraison Urbaine Express',
        template: 'DELIVERY',
        baseFee: 1500,
        perKmRate: 100,
        minDistance: 1,
        maxDistance: 20,
        perKgRate: 30,
        freeWeightKg: 2,
        perM3Rate: 100,
        fragileMultiplier: 1.3,
        urgentMultiplier: 1.8,
        nightMultiplier: 1.5,
        proximityDiscountPercent: 15,
        proximityThresholdKm: 1,
        heavyLoadSurchargeThresholdKg: 30,
        heavyLoadSurchargePercent: 20,
        lightLoadDiscountThresholdKg: 0.5,
        lightLoadDiscountPercent: 10,
        isActive: false,
        companyId: 'C1',
        driverId: null
    }
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
            // First get the zones
            const zones = await zoneService.list();

            // Then get the drivers to see who is assigned to what
            // we use the driverService.listDrivers which returns CompanyDriverSetting[]
            // and each setting has an activeZoneId
            let assignedDriversMap: Record<string, string[]> = {};
            try {
                const { data: driversSettings } = await driverService.listDrivers();
                driversSettings.forEach(cds => {
                    if (cds.activeZoneId) {
                        if (!assignedDriversMap[cds.activeZoneId]) assignedDriversMap[cds.activeZoneId] = [];
                        assignedDriversMap[cds.activeZoneId].push(cds.driverId);
                    }
                });
            } catch (e) {
                console.warn('Failed to fetch assigned drivers map:', e);
            }

            return zones.map((z: any) => ({
                ...z,
                assignedDriverIds: assignedDriversMap[z.id] || z.assignedDriverIds || z.drivers?.map((d: any) => d.id) || []
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
        try {
            const { trackingApi } = await import('./tracking');
            const realPositions = await trackingApi.getAllDriversLocations();

            if (realPositions && realPositions.length > 0) {
                return realPositions.map(rp => ({
                    driverId: rp.id,
                    vehicleId: '', // We don't have vehicle info in condensed state yet
                    lat: rp.lat,
                    lng: rp.lng,
                    heading: rp.heading || 0,
                    speed: 0,
                    status: (rp as any).status || 'ONLINE',
                    ordersInProgress: 0
                }));
            }
        } catch (e) {
            console.warn('Failed to fetch real driver positions, using mock', e);
        }

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
