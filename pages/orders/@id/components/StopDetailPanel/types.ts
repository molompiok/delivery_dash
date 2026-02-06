import { Variants } from 'framer-motion';

export interface SequentialDatePickerProps {
    label: string;
    value: string | null;
    onChange: (iso: string) => void;
    icon: any;
    color?: string;
}

export interface Action {
    id?: string;
    type?: 'pickup' | 'delivery' | 'service';
    productName?: string;
    transitItemId?: string;
    transitItem?: any;
    quantity?: number;
    service_time?: number;
    status?: string;
    secure?: string;
    requirements?: string[];
    confirmation?: {
        photo?: any[];
        code?: any[];
    };
    product?: {
        name?: string;
    };
}

export interface StopDetailPanelProps {
    isOpen: boolean;
    onClose: () => void;
    stop: any;
    availableTransitItems?: any[];
    onUpdate: (updatedStop: any, fieldPath?: string, value?: any) => void | Promise<void>;
    onUpdateAction: (actionId: string, updatedAction: any) => void | Promise<void>;
    onAddAction: (stopId: string, type: string) => Promise<any>;
    onDelete: () => void;
    orderId: string;
}

export interface NewItemFormState {
    name: string;
    weight: number;
    unitary_price: number;
    packaging_type: 'box' | 'fluid';
    dimensions: { width_cm: number; height_cm: number; depth_cm: number };
    requirements: string[];
}

export type ViewType = 'stop' | 'product' | 'validation-edit' | 'map' | 'transit-item-detail';

// Animation variants for view transitions
export const variants: Variants = {
    enter: (dir: number) => ({
        x: dir > 0 ? 50 : -50,
        opacity: 0
    }),
    center: {
        x: 0,
        opacity: 1
    },
    exit: (dir: number) => ({
        x: dir > 0 ? -50 : 50,
        opacity: 0
    })
};

export const transition = {
    type: 'spring' as const,
    stiffness: 350,
    damping: 30
};

// Shared context type for passing data to views
export interface StopDetailContext {
    // State
    stop: any;
    orderId: string;
    availableTransitItems: any[];
    direction: number;
    view: ViewType;
    editingProductIdx: number | null;
    selectedValidationType: 'photo' | 'code' | null;
    editingValidationIdx: number | null;
    isEditingAddress: boolean;
    confirmDeleteKey: string | null;
    isCreatingAction: boolean;
    creationError: string | null;
    pendingActionType: string | null;
    transitItemSearch: string;
    isSearchingTransitItems: boolean;
    isCreatingTransitItem: boolean;
    newItemForm: NewItemFormState;
    isConfirmingStopDelete: boolean;

    // Setters
    setDirection: (dir: number) => void;
    setView: (view: ViewType) => void;
    setEditingProductIdx: (idx: number | null) => void;
    setSelectedValidationType: (type: 'photo' | 'code' | null) => void;
    setEditingValidationIdx: (idx: number | null) => void;
    setIsEditingAddress: (val: boolean) => void;
    setConfirmDeleteKey: (key: string | null) => void;
    setIsCreatingAction: (val: boolean) => void;
    setCreationError: (err: string | null) => void;
    setPendingActionType: (type: string | null) => void;
    setTransitItemSearch: (search: string) => void;
    setIsSearchingTransitItems: (val: boolean) => void;
    setIsCreatingTransitItem: (val: boolean) => void;
    setNewItemForm: (form: NewItemFormState) => void;
    setIsConfirmingStopDelete: (val: boolean) => void;

    // Handlers
    handleFieldChange: (fieldPath: string, value: any) => void;
    handleProductChange: (idx: number, field: string, value: any) => void;
    handleActionUpdate: (actionId: string, payload: any) => void;
    handleTransitItemChange: (itemId: string, field: string, value: any) => Promise<void>;
    handleCreateTransitItem: () => void;
    handleConfirmCreateTransitItem: () => Promise<void>;
    handleOpenCreateItemForm: () => void;
    performAddAction: (type: string) => Promise<void>;

    // Props callbacks
    onClose: () => void;
    onDelete: () => void;
}
