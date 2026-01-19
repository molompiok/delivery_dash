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
    dayOfWeek?: number; // 1-7 (Monday-Sunday)
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
    files?: FileRecord[];
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
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'REMOVED';
    driver: User;
}
