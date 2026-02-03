import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ConfirmModal } from '../../../../components/ConfirmModal';
import { ordersApi } from '../../../../api/orders';

// Import extracted components
import {
    SequentialDatePicker,
    CreateItemView,
    MapSelectorView,
    ValidationDetailView,
    ProductDetailView,
    StopListView,
    ViewType,
    NewItemFormState,
    StopDetailPanelProps
} from './StopDetailPanel/index';



const StopDetailPanel: React.FC<StopDetailPanelProps> = ({
    isOpen,
    onClose,
    stop,
    availableTransitItems = [],
    onUpdate,
    onUpdateAction,
    onAddAction,
    onDelete,
    orderId
}) => {
    const [view, setView] = useState<ViewType>('stop');
    const [direction, setDirection] = useState(0);

    // Map State
    const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>({ lat: 48.8566, lng: 2.3522 }); // Default Paris
    const [selectedLocation, setSelectedLocation] = useState<google.maps.LatLngLiteral | null>(null);
    const [editingProductIdx, setEditingProductIdx] = useState<number | null>(null);
    const [selectedValidationType, setSelectedValidationType] = useState<'photo' | 'code' | null>(null);
    const [editingValidationIdx, setEditingValidationIdx] = useState<number | null>(null);
    const [isEditingAddress, setIsEditingAddress] = useState(false);

    // Deletion state
    const [isConfirmingStopDelete, setIsConfirmingStopDelete] = useState(false);
    const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);

    // Creation state
    const [isCreatingAction, setIsCreatingAction] = useState(false);
    const [creationError, setCreationError] = useState<string | null>(null);
    const [pendingActionType, setPendingActionType] = useState<string | null>(null);

    // Transit Item state
    const [transitItemSearch, setTransitItemSearch] = useState('');
    const [isSearchingTransitItems, setIsSearchingTransitItems] = useState(false);
    const [isCreatingTransitItem, setIsCreatingTransitItem] = useState(false);

    // New Transit Item Form State
    const [newItemForm, setNewItemForm] = useState<NewItemFormState>({
        name: '',
        weight_g: 0,
        unitary_price: 0,
        packaging_type: 'box',
        dimensions: { width_cm: 0, height_cm: 0, depth_cm: 0 },
        requirements: []
    });

    useEffect(() => {
        if (!isOpen) {
            setView('stop');
            setEditingProductIdx(null);
            setSelectedValidationType(null);
            setEditingValidationIdx(null);
            setConfirmDeleteKey(null);
        }
    }, [isOpen]);

    const performAddAction = async (type: string) => {
        setIsCreatingAction(true);
        setCreationError(null);
        setPendingActionType(type);
        setView('product');
        setDirection(1);

        try {
            const action = await onAddAction(stop.id, type);
            if (action) {
                setIsCreatingAction(false);
            } else {
                setCreationError("Impossible de créer le produit.");
            }
        } catch (err) {
            setCreationError("Une erreur est survenue lors de la création.");
        }
    };

    // Auto-select the newly created action when stop actions change
    useEffect(() => {
        if (!isCreatingAction && pendingActionType && stop?.actions) {
            const newActionIdx = stop.actions.length - 1;
            if (newActionIdx >= 0) {
                setEditingProductIdx(newActionIdx);
                setPendingActionType(null);
            }
        }
    }, [stop?.actions, isCreatingAction]);

    const handleOpenCreateItemForm = () => {
        setNewItemForm({
            name: '',
            weight_g: 0,
            unitary_price: 0,
            packaging_type: 'box',
            dimensions: { width_cm: 0, height_cm: 0, depth_cm: 0 },
            requirements: []
        });
        setDirection(1);
        setView('create-item');
    };

    const handleConfirmCreateTransitItem = async () => {
        if (editingProductIdx === null) return;
        setIsCreatingTransitItem(true);
        try {
            const result = await ordersApi.addItem(orderId, {
                name: newItemForm.name || 'Nouveau produit',
                packaging_type: newItemForm.packaging_type,
                weight_g: newItemForm.weight_g,
                unitary_price: newItemForm.unitary_price,
                dimensions: newItemForm.dimensions,
                metadata: { requirements: newItemForm.requirements }
            });
            const newItem = result.entity || result.item;

            if (newItem) {
                handleProductChange(editingProductIdx, 'transitItemId', newItem.id);
                setTransitItemSearch('');
                setDirection(-1);
                setView('product');
            }
        } catch (error) {
            console.error("Failed to create transit item", error);
        } finally {
            setIsCreatingTransitItem(false);
        }
    };

    const handleCreateTransitItem = async () => {
        handleOpenCreateItemForm();
    };

    if (!stop) return null;

    const product = editingProductIdx !== null ? stop.actions?.[editingProductIdx] : null;

    const handleTransitItemChange = async (itemId: string, field: string, value: any) => {
        if (!itemId || editingProductIdx === null) return;

        // Optimistic update of local state
        const updatedAction = {
            ...product,
            transitItem: {
                ...product?.transitItem,
                [field]: value
            }
        };
        handleProductChange(editingProductIdx, '', updatedAction);

        try {
            await ordersApi.updateItem(itemId, { [field]: value });
        } catch (error) {
            console.error("Failed to update transit item", error);
        }
    };

    const handleFieldChange = (fieldPath: string, value: any) => {
        const newData = { ...stop };
        const paths = fieldPath.split('.');
        let current: any = newData;
        for (let i = 0; i < paths.length - 1; i++) {
            if (!current[paths[i]]) current[paths[i]] = {};
            current = current[paths[i]];
        }
        current[paths[paths.length - 1]] = value;
        onUpdate(newData, fieldPath, value);
    };

    const handleProductChange = (idx: number, field: string, value: any) => {
        const product = stop.actions?.[idx];
        if (!product) return;

        const newData = { ...stop };
        const newActions = [...newData.actions];
        let newAction = { ...newActions[idx] };

        if (field === '' || field === null) {
            // Replace entire action
            newAction = { ...newAction, ...value };
        } else {
            const paths = field.replace('actions.', '').split('.');
            let current: any = newAction;
            for (let i = 0; i < paths.length - 1; i++) {
                if (!current[paths[i]]) current[paths[i]] = {};
                current = current[paths[i]];
            }
            current[paths[paths.length - 1]] = value;
        }

        newActions[idx] = newAction;
        newData.actions = newActions;
        onUpdate(newData, field, value);

        // Granular update for action if field is within action
        if (newAction.id) {
            onUpdateAction(newAction.id, newAction);
        }
    };

    const renderContent = () => {
        switch (view) {
            case 'stop':
                return (
                    <StopListView
                        direction={direction}
                        stop={stop}
                        isEditingAddress={isEditingAddress}
                        confirmDeleteKey={confirmDeleteKey}
                        setDirection={setDirection}
                        setView={setView}
                        setIsEditingAddress={setIsEditingAddress}
                        setMapCenter={setMapCenter}
                        setSelectedLocation={setSelectedLocation}
                        setEditingProductIdx={setEditingProductIdx}
                        setConfirmDeleteKey={setConfirmDeleteKey}
                        setIsConfirmingStopDelete={setIsConfirmingStopDelete}
                        handleFieldChange={handleFieldChange}
                        performAddAction={performAddAction}
                        onClose={onClose}
                    />
                );
            case 'product':
                return (
                    <ProductDetailView
                        direction={direction}
                        stop={stop}
                        editingProductIdx={editingProductIdx}
                        isCreatingAction={isCreatingAction}
                        creationError={creationError}
                        pendingActionType={pendingActionType}
                        transitItemSearch={transitItemSearch}
                        isSearchingTransitItems={isSearchingTransitItems}
                        isCreatingTransitItem={isCreatingTransitItem}
                        confirmDeleteKey={confirmDeleteKey}
                        availableTransitItems={availableTransitItems}
                        setDirection={setDirection}
                        setView={setView}
                        setCreationError={setCreationError}
                        setTransitItemSearch={setTransitItemSearch}
                        setIsSearchingTransitItems={setIsSearchingTransitItems}
                        setConfirmDeleteKey={setConfirmDeleteKey}
                        setSelectedValidationType={setSelectedValidationType}
                        setEditingValidationIdx={setEditingValidationIdx}
                        handleProductChange={handleProductChange}
                        handleTransitItemChange={handleTransitItemChange}
                        handleCreateTransitItem={handleCreateTransitItem}
                        performAddAction={performAddAction}
                    />
                );
            case 'validation-edit':
                return (
                    <ValidationDetailView
                        direction={direction}
                        editingProductIdx={editingProductIdx}
                        selectedValidationType={selectedValidationType}
                        editingValidationIdx={editingValidationIdx}
                        stop={stop}
                        setDirection={setDirection}
                        setView={setView}
                        setSelectedValidationType={setSelectedValidationType}
                        setEditingValidationIdx={setEditingValidationIdx}
                        handleProductChange={handleProductChange}
                    />
                );
            case 'create-item':
                return (
                    <CreateItemView
                        direction={direction}
                        newItemForm={newItemForm}
                        isCreatingTransitItem={isCreatingTransitItem}
                        setDirection={setDirection}
                        setView={setView}
                        setNewItemForm={setNewItemForm}
                        handleConfirmCreateTransitItem={handleConfirmCreateTransitItem}
                    />
                );
            case 'map':
                return (
                    <MapSelectorView
                        direction={direction}
                        stop={stop}
                        mapCenter={mapCenter}
                        selectedLocation={selectedLocation}
                        setDirection={setDirection}
                        setView={setView}
                        setMapCenter={setMapCenter}
                        setSelectedLocation={setSelectedLocation}
                        handleFieldChange={handleFieldChange}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        onClick={onClose}
                        className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-[100]"
                    />

                    {/* Panel */}
                    <div
                        className="fixed right-0 top-0 bottom-0 w-[420px] bg-[#f8fafc] shadow-2xl z-[101] flex flex-col border-l border-white/50 overflow-hidden"
                    >
                        <AnimatePresence mode="wait" custom={direction}>
                            {renderContent()}
                        </AnimatePresence>
                    </div>
                </>
            )}
            <ConfirmModal
                isOpen={isConfirmingStopDelete}
                onClose={() => setIsConfirmingStopDelete(false)}
                onConfirm={() => {
                    onDelete();
                    setIsConfirmingStopDelete(false);
                }}
                title="Supprimer cet arrêt ?"
                description="Cette action est irréversible. Toutes les informations associées seront perdues."
                confirmLabel="Supprimer"
                confirmVariant="danger"
            />
        </div>
    );
};

export default StopDetailPanel;
