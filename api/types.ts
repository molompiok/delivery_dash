export interface Address {
    id?: string;
    label: string;
    formattedAddress: string;
    lat: number;
    lng: number;
    isDefault: boolean;
    isActive: boolean;
}

export type ScheduleCategory = 'WORK' | 'LEAVE' | 'MANAGEMENT';

export interface ScheduleLink {
    name: string;
    url: string;
    icon?: string;
}

export interface Schedule {
    id?: string;

    // Polymorphic ownership
    ownerType: 'User' | 'Company';
    ownerId: string;

    // Basic information
    title?: string;
    description?: string;

    // Category and type
    scheduleCategory?: ScheduleCategory;
    scheduleType?: 'OPENING' | 'AVAILABILITY' | 'WORK' | 'DELIVERY' | 'CLOSED';
    recurrenceType: 'WEEKLY' | 'DATE_RANGE' | 'SPECIFIC_DATE' | 'MANUAL_OVERRIDE';

    // Recurrence
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
    startDate?: string; // YYYY-MM-DD
    endDate?: string;
    specificDate?: string;

    // Time
    startTime: string; // HH:mm
    endTime: string;

    // Appearance
    color?: string;
    icon?: string;

    // Links
    links?: ScheduleLink[];

    // Metadata
    affectsAvailability?: boolean;
    isPublic?: boolean;
    isActive?: boolean;
    capacity?: number;
    priority?: number;

    // Assigned users
    assignedUsers?: User[];
}

export interface Vehicle {
    id: string;
    type: 'MOTO' | 'CAR_SEDAN' | 'VAN' | 'TRUCK' | 'BICYCLE';
    brand: string;
    model: string;
    plate: string;
    color?: string;
    energy: 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
    year?: number;
    verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    isActive: boolean;
    assignedDriverId: string | null;
    companyId: string | null;
    ownerType: 'Company' | 'User';
    ownerId: string;
    specs: {
        maxWeight?: number;
        cargoVolume?: number;
        height?: number;
        length?: number;
        width?: number;
    } | null;
    metadata?: {
        assignmentHistory?: Array<{
            driverId: string | null;
            driverName: string;
            managerId: string;
            managerName: string;
            action: 'ASSIGNED' | 'UNASSIGNED';
            timestamp: string;
        }>;
    } | null;
    assignedDriver?: User;
    // Legacy files array (for backward compatibility)
    files?: FileRecord[];
    // New computed document properties from FileManager
    vehicleInsurance?: string[];
    vehicleTechnicalVisit?: string[];
    vehicleRegistration?: string[];
}

export interface User {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string; // 'DRIVER' | 'COMPANY_MANAGER' ...
    companyId?: string;
    verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export interface Company {
    id: string;
    companyName: string;
    registreCommerce?: string;
    email: string;
    phone: string;
    isVerified: boolean;
}

export interface FileMetadata {
    expiryDate?: string;
    docNumber?: string;
}

export interface FileRecord {
    id: string;
    path: string;
    name: string;
    mimeType: string;
    fileCategory: string;
    tableColumn: string;
    metadata?: FileMetadata;
    validationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
    validationComment?: string | null;
}

export interface CompanyDriverSetting {
    id: string;
    companyId: string;
    driverId: string;
    status: 'ACCESS_ACCEPTED' | 'ACCEPTED' | 'PENDING' | 'REJECTED' | 'REMOVED';
    activeZoneId?: string | null;
    activeVehicleId?: string | null;
    driver: User;
}

export type OrderTemplate = 'MISSION' | 'VOYAGE' | 'COMMANDE';

export interface ZoneMatrixPair {
    fromZoneId: string;
    toZoneId: string;
    basePrice: number;
    bidirectional?: boolean;
}

export interface ZoneMatrixConfig {
    pairs: ZoneMatrixPair[];
}

export interface PricingFilter {
    id: string;
    companyId: string | null;
    driverId: string | null;
    name: string;
    template: OrderTemplate | null;
    baseFee: number;
    perKmRate: number;
    minDistance: number;
    maxDistance: number | null;
    perKgRate: number;
    freeWeightKg: number;
    perM3Rate: number;
    fragileMultiplier: number;
    urgentMultiplier: number;
    nightMultiplier: number;
    proximityDiscountPercent: number;
    proximityThresholdKm: number;
    heavyLoadSurchargeThresholdKg: number;
    heavyLoadSurchargePercent: number;
    lightLoadDiscountThresholdKg: number;
    lightLoadDiscountPercent: number;
    zoneMatrixEnabled?: boolean;
    zoneMatrix?: ZoneMatrixConfig;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface Zone {
    id: string;
    ownerType: 'Company' | 'User' | 'Sublymus';
    ownerId: string | null;
    sourceZoneId?: string | null;
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

export interface SubscriptionInvoice {
    id: string;
    month: string;
    baseAmount: number;
    commissionAmount: number;
    ticketFeeAmount: number;
    taxAmount: number;
    totalAmount: number;
    totalAmountWithTax: number;
    status: 'ISSUED' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    paidAt?: string;
    dueDate: string;
    currency: string;
}

export interface SubscriptionStatus {
    currentPlan: string;
    status: 'ACTIVE' | 'OVERDUE' | 'GRACE_PERIOD';
    nextBillingDate: string;
    outstandingAmount: number;
}

export interface Wallet {
    id: string;
    ownerId: string;
    ownerName: string | null;
    owner_name?: string | null;
    entityType: string;
    balanceAccounting: number;
    balanceAvailable: number;
    currency: string;
    isLocked: boolean;
    walletType?: 'PERSONAL' | 'COMPANY';
    label?: string;
    image_url?: string;
}

export interface Transaction {
    id: string;
    wallet_id: string;
    amount: number;
    category: string;
    label: string;
    status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'CANCELLED';
    external_reference?: string;
    metadata?: any;
    created_at: string;
    updated_at: string;
    wallet?: Wallet;
    type?: 'IN' | 'OUT';
}

export interface WalletStats {
    income: number;
    expense: number;
    net: number;
    transaction_count: number;
    by_category?: Record<string, number>;
    daily?: Array<{
        date: string;
        income: number;
        expense: number;
        net: number;
    }>;
    wallet?: Wallet;
}
