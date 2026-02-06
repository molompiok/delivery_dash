import React, { useState, useEffect, useRef } from 'react';
import { usePageContext } from 'vike-react/usePageContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    Plus,
    Maximize2,
    Minimize2,
    Navigation,
    ChevronLeft as ChevronLeftIcon,
    MoreVertical,
    Truck,
    Clock,
    Settings2,
    LayoutGrid,
    CheckCircle2,
    Phone,
    MessageSquare,
    Zap,
    Leaf,
    ShoppingBag,
    X,
    FileText,
    User,
    MapPin,
    AlertTriangle,
    Loader2,
    RotateCcw,
    Send,
    Check,
    Layers
} from 'lucide-react';
import { arrayMove } from '@dnd-kit/sortable';
import ListOptions from './components/ListOptions';
import StopListWrapper from './components/StopListWrapper';
import { MapLibre as GoogleMap, Marker, Polyline } from '../../../components/MapLibre';
import { useHeader } from '../../../context/HeaderContext';
import { ConfirmModal } from '../../../components/ConfirmModal';
import StopDetailPanel from './components/StopDetailPanel';
import { ordersApi, Order, Step as ApiStep, ValidationIssue } from '../../../api/orders';
import { driverService } from '../../../api/drivers';
import { fleetService } from '../../../api/fleet';
import { trackingApi } from '../../../api/tracking';
import { User as UserType, CompanyDriverSetting, Vehicle } from '../../../api/types';

interface Stop {
    id: string;
    type: string;
    typeColor: string;
    status?: 'PENDING' | 'ARRIVED' | 'COMPLETED' | 'FAILED';
    address: {
        id: string;
        addressId?: string;
        name: string;
        street: string;
        city: string;
        country: string;
        lat?: number;
        lng?: number;
    };
    opening: {
        start: string;
        end: string;
    };
    actions: any[];
    client: {
        name: string;
        avatar: string;
        phone?: string;
    };
    estimatedTime?: string;
    // Tracking fields for server sync
    isNew?: boolean; // Created locally, not yet saved
    isModified?: boolean; // Modified locally
    isPending?: boolean; // Currently being created on server
    isPendingChange?: boolean; // Modified on server (Shadow)
}

interface PageStep {
    id?: string; // Server ID (undefined for new steps)
    name: string;
    stops: Stop[];
    searchQuery: string;
    isSearchExpanded: boolean;
    isLinked: boolean;
    isNew?: boolean;
}

export default function Page() {
    const pageContext = usePageContext();
    const { id } = pageContext.routeParams;

    // Core state
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [steps, setSteps] = useState<PageStep[]>([]);
    const [driverLocation, setDriverLocation] = useState<any>(null); // Real-time position
    const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
    const [showRevertModal, setShowRevertModal] = useState(false);

    const [activeStep, setActiveStep] = useState(0);
    const [isRouteLoading, setIsRouteLoading] = useState(false);
    const [direction, setDirection] = useState(0);
    const [isSidebarFullscreen, setIsSidebarFullscreen] = useState(false);
    const [activeRouteTab, setActiveRouteTab] = useState<'details' | 'history'>('details');
    const [visibleLayers, setVisibleLayers] = useState({
        live: true,
        pending: true,
        actual: true
    });
    const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
    const { setHeaderContent, clearHeaderContent } = useHeader();
    const listRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
    const kanbanRef = useRef<HTMLDivElement | null>(null);

    // Stop Detail Panel State
    const [selectedStop, setSelectedStop] = useState<any>(null);
    const [isStopDetailOpen, setIsStopDetailOpen] = useState(false);
    const [selectedStopMeta, setSelectedStopMeta] = useState<{ stepIdx: number; stopIdx: number } | null>(null);

    const handleOpenStopDetail = (stepIdx: number, stopIdx: number, stopOverride?: any) => {
        const stop = stopOverride || steps[stepIdx].stops[stopIdx];
        if (!stop) return;

        setSelectedStop(stop);
        setSelectedStopMeta({ stepIdx, stopIdx });
        setIsStopDetailOpen(true);
    };

    const handleCloseStopDetail = () => {
        setIsStopDetailOpen(false);
        setSelectedStop(null);
        setSelectedStopMeta(null);
    };

    // Fleet & Drivers for assignment
    const [drivers, setDrivers] = useState<CompanyDriverSetting[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoadingFleet, setIsLoadingFleet] = useState(false);
    const [assignedDriver, setAssignedDriver] = useState<CompanyDriverSetting | null>(null);
    const [assignedVehicle, setAssignedVehicle] = useState<Vehicle | null>(null);

    // --- SERVER DATA LOADING ---
    useEffect(() => {
        if (id) {
            fetchOrder();
            loadFleetData();
        }
    }, [id]);

    // Keep selectedStop in sync with steps data
    useEffect(() => {
        if (selectedStopMeta && steps[selectedStopMeta.stepIdx]) {
            const currentStop = steps[selectedStopMeta.stepIdx].stops[selectedStopMeta.stopIdx];
            if (currentStop && JSON.stringify(currentStop) !== JSON.stringify(selectedStop)) {
                setSelectedStop(currentStop);
            }
        }
    }, [steps, selectedStopMeta]);

    const mapServerToLocalSteps = (serverSteps: ApiStep[]): PageStep[] => {
        if (!serverSteps || serverSteps.length === 0) {
            return [];
        }

        return serverSteps.map((s, idx) => ({
            id: s.id,
            name: `Step ${idx + 1}`,
            isLinked: s.linked ?? false,
            searchQuery: '',
            isSearchExpanded: false,
            stops: (s.stops || []).map(st => {
                const addressExtra = st.metadata?.address_extra || {};
                const clientData = st.client || {};
                const openingHours = clientData.opening_hours || {};

                return {
                    id: st.id,
                    status: st.status,
                    type: (st.actions && st.actions.length > 0)
                        ? (st.actions[0].type === 'PICKUP' ? 'Collecte' : st.actions[0].type === 'DELIVERY' ? 'Livraison' : 'Service')
                        : 'Service',
                    typeColor: (st.actions && st.actions.length > 0)
                        ? (st.actions[0].type === 'PICKUP' ? 'bg-orange-50 text-orange-600' : st.actions[0].type === 'DELIVERY' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600')
                        : 'bg-blue-50 text-blue-600',
                    address: {
                        id: st.address?.id || '',
                        addressId: st.addressId,
                        name: st.address?.label || '',
                        street: st.address?.street || st.address?.formattedAddress || '',
                        city: st.address?.city || '',
                        country: st.address?.country || '',
                        lat: st.address?.lat,
                        lng: st.address?.lng,
                        call: st.address?.call || '',
                        room: st.address?.room || '',
                        stage: st.address?.stage || ''
                    },
                    opening: {
                        start: openingHours.start || st.arrivalWindowStart || '08:00',
                        end: openingHours.end || st.arrivalWindowEnd || '18:00'
                    },
                    actions: (st.actions || []).map(a => ({
                        id: a.id,
                        type: a.type?.toLowerCase() || 'service',
                        productName: a.transitItem?.name || a.metadata?.productName || (a.type === 'SERVICE' ? 'Service' : 'Produit'),
                        productDescription: a.transitItem?.description || a.metadata?.productDescription || '',
                        unitaryPrice: a.transitItem?.unitary_price || a.metadata?.unitaryPrice || 0,
                        quantity: a.quantity || 1,
                        service_time: (a.serviceTime || 600) / 60, // Convert seconds to minutes
                        status: a.status || 'PENDING',
                        requirements: a.transitItem?.requirements || a.metadata?.requirements || [],
                        confirmation: a.confirmationRules || { photo: [], code: [] },

                        // Extra technical fields for reuse
                        transitItemId: a.transitItemId,
                        productUrl: a.transitItem?.product_url || a.metadata?.productUrl,
                        packagingType: a.transitItem?.packaging_type || a.metadata?.packagingType,
                        weight: a.transitItem?.weight || a.metadata?.weight || a.metadata?.weight, // unified in grams
                        dimensions: a.transitItem?.dimensions ? {
                            width: a.transitItem.dimensions.width_cm,
                            height: a.transitItem.dimensions.height_cm,
                            depth: a.transitItem.dimensions.depth_cm,
                            volume: a.transitItem.dimensions.volume_l
                        } : a.metadata?.dimensions
                    })),
                    client: {
                        name: clientData.name || '',
                        avatar: clientData.avatar || '',
                        phone: clientData.phone || '',
                        email: clientData.email || '',
                        clientId: clientData.clientId,
                        opening_hours: openingHours
                    },
                    metadata: st.metadata,
                    isPendingChange: st.isPendingChange
                };
            })
        }));
    };

    const fetchOrder = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            const response = await ordersApi.get(id);
            const serverOrder = (response as any).entity || (response as any).order || response;

            const serverSteps = Array.isArray(serverOrder.steps) ? serverOrder.steps : [];
            const mappedSteps = mapServerToLocalSteps(serverSteps);
            setSteps(mappedSteps);
            setOrder(serverOrder);

            // Deferred route loading
            fetchRoute();
        } catch (error) {
            console.error("Failed to fetch order", error);
            showAlert("Erreur", "Impossible de charger les détails de la commande.");
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    const fetchRoute = async (options: { force?: boolean } = {}) => {
        if (!id) return;
        setIsRouteLoading(true);
        try {
            const routeData = await ordersApi.getRoute(id, ['live', 'pending', 'trace'], options);
            setOrder(prev => prev ? {
                ...prev,
                live_route: routeData.live_route,
                pending_route: routeData.pending_route,
                actual_trace: routeData.actual_trace,
                route_metadata: routeData.metadata
            } : null);
        } catch (error) {
            console.error("Failed to fetch route", error);
        } finally {
            setIsRouteLoading(false);
        }
    };

    const loadFleetData = async () => {
        setIsLoadingFleet(true);
        try {
            const userStr = localStorage.getItem('delivery_user');
            if (userStr) {
                const user: UserType = JSON.parse(userStr);
                if (user.companyId) {
                    const [driversRes, vehiclesRes] = await Promise.all([
                        driverService.listDrivers({ status: 'ACCEPTED' }),
                        fleetService.listVehicles(user.companyId)
                    ]);

                    setDrivers(driversRes.data);
                    setVehicles(vehiclesRes.data);

                    // Auto-select first available driver with a vehicle
                    const firstDriver = driversRes.data[0];
                    if (firstDriver) {
                        setAssignedDriver(firstDriver);
                        const firstVehicle = vehiclesRes.data.find(v => v.assignedDriverId === firstDriver.driverId || !v.assignedDriverId);
                        if (firstVehicle) {
                            setAssignedVehicle(firstVehicle);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Failed to load fleet data", error);
        } finally {
            setIsLoadingFleet(false);
        }
    };

    // --- REAL-TIME TRACKING POLLING ---
    useEffect(() => {
        if (!id || !order?.driverId) {
            setDriverLocation(null);
            return;
        }

        const pollLocation = async () => {
            try {
                const pos = await trackingApi.getDriverLocation(order.driverId!);
                setDriverLocation(pos);
            } catch (error) {
                // Silently ignore polling errors
                console.debug("[TRACKING] Polling failed", error);
            }
        };

        pollLocation(); // Immediate first fetch
        const interval = setInterval(pollLocation, 5000); // 5s interval matching mobile app
        return () => clearInterval(interval);
    }, [id, order?.driverId]);

    // This function is now only used for logging/debugging purposes
    const mapStepsForDebug = (currentSteps: PageStep[], driver: CompanyDriverSetting | null, vehicle: Vehicle | null) => {
        const transitItems: any[] = [];

        // 1. Prepare Transit Items
        currentSteps.forEach(step => {
            step.stops.forEach(stop => {
                stop.actions.forEach((action: any) => {
                    // Skip delivery actions - they reference existing transit items
                    if (action.type === 'delivery') return;

                    const itemId = action.productId || `item_${Math.random().toString(36).substring(2, 11)}`;
                    transitItems.push({
                        id: itemId,
                        product_id: action.productId,
                        name: action.productName || 'Nouveau Produit',
                        description: action.productDescription || '',
                        packaging_type: action.packagingType === 'fluid' ? 'fluid' : 'box',
                        weight: (action.weight || 0) * 1000,
                        volume_l: action.dimensions?.volume || 0, // For fluid items
                        dimensions: {
                            width_cm: action.dimensions?.width || 0,
                            height_cm: action.dimensions?.height || 0,
                            length_cm: action.dimensions?.depth || 0,
                        },
                        unitary_price: action.unitaryPrice || 0,
                        requirements: action.requirements || [], // ['froid', 'fragile', 'dangerous', 'sec']
                        type_product: action.typeProduct || [], // ['liquide', 'poudre', 'papier', 'food']
                        metadata: {}
                    });
                    action._transitItemId = itemId;
                });
            });
        });

        // 2. Map Hierarchical Payload
        return {
            steps: currentSteps.map((step, sIdx) => ({
                sequence: sIdx,
                linked: step.isLinked,
                stops: step.stops.map((stop, stIdx) => ({
                    address_text: typeof stop.address === 'string' ? stop.address : (stop.address.street || stop.address.name || ''),
                    coordinates: stop.address.lat && stop.address.lng ? [stop.address.lat, stop.address.lng] : undefined,
                    sequence: stIdx,
                    actions: stop.actions.map((action: any) => ({
                        type: action.type as 'pickup' | 'delivery' | 'service',
                        transit_item_id: action.type === 'delivery' ? action.transitItemId : action._transitItemId,
                        quantity: action.type === 'service' ? 0 : (action.quantity || 1),
                        service_time: (action.service_time || 5) * 60, // Convert minutes to seconds
                        confirmation_rules: {
                            // Map photo validations from frontend structure
                            photo: (action.confirmation?.photo || []).map((p: any) => ({
                                name: p.name || 'Photo',
                                pickup: p.pickup ?? false,
                                delivery: p.delivery ?? false,
                                compare: p.compare ?? false,
                                reference: p.reference || null,
                            })),
                            // Map code validations from frontend structure
                            code: (action.confirmation?.code || []).map((c: any) => ({
                                name: c.name || 'Code',
                                pickup: c.pickup ?? false,
                                delivery: c.delivery ?? false,
                                compare: c.compare ?? false,
                                reference: c.reference || null,
                            })),
                        },
                        metadata: {
                            productName: action.productName,
                            productDescription: action.productDescription,
                            unitaryPrice: action.unitaryPrice,
                            client: stop.client
                        }
                    }))
                }))
            })),
            transit_items: transitItems,
            assignment_mode: driver ? 'TARGET' : 'GLOBAL',
            ref_id: driver?.driverId,
            priority: 'MEDIUM'
        };
    };

    // Real-time Order State Tracker (debug)
    useEffect(() => {
        if (steps.length > 0) {
            const payload = mapStepsForDebug(steps, assignedDriver, assignedVehicle);
            console.log("%c[ORDER STATE]", "color: #2563eb; font-weight: bold; font-size: 11px;", payload);
        }
    }, [steps, assignedDriver, assignedVehicle]);

    // Submit DRAFT order -> PENDING
    const handleSubmit = async () => {
        if (!order || !id) return;

        try {
            const result = await ordersApi.submit(id);
            setOrder(result.order);
            showAlert("Commande soumise", `La commande ${id} a été soumise avec succès.`);
        } catch (error: any) {
            console.error("Submission failed", error);
            showAlert("Échec de la soumission", error.response?.data?.message || error.message || "Une erreur s'est produite.");
            // Refresh order to get consistent state
            await fetchOrder(false);
        }
    };

    // Push updates to driver (PENDING+ orders)
    const handlePushUpdates = async () => {
        if (!order || !id) return;

        try {
            await ordersApi.pushUpdates(id);
            // Important: Re-fetch the whole order to get back ORIGINAL IDs (shadows merged)
            await fetchOrder(true);
            showAlert("Mise à jour envoyée", `Les modifications ont été envoyées au chauffeur.`);
        } catch (error: any) {
            console.error("Push updates failed", error);
            showAlert("Échec de l'envoi", error.response?.data?.message || error.message || "Une erreur s'est produite.");
            await fetchOrder(false);
        }
    };

    // Revert pending changes
    const handleRevert = () => {
        console.log("Revert button clicked");
        if (!order || !id) return;
        setShowRevertModal(true);
        console.log("Modal state set to true");
    };

    const executeRevert = async () => {
        if (!order || !id) return;
        try {
            await ordersApi.revertChanges(id);
            await fetchOrder(true); // Full reload to clear shadows
            showAlert("Modifications annulées", "Toutes les modifications en attente ont été supprimées.");
        } catch (error: any) {
            console.error("Revert failed", error);
            showAlert("Erreur", error.response?.data?.message || error.message || "Impossible d'annuler les modifications.");
        }
    };

    const syncEntityUpdate = (type: 'stop' | 'action', oldId: string, newEntity: any) => {
        setSteps(prev => prev.map(step => ({
            ...step,
            stops: step.stops.map(stop => {
                if (type === 'stop' && stop.id === oldId) {
                    const updatedStop = {
                        ...stop,
                        id: newEntity.id,
                        isPendingChange: newEntity.isPendingChange
                    };
                    if (selectedStop?.id === oldId) setSelectedStop(updatedStop);
                    return updatedStop;
                }

                const updatedActions = stop.actions.map(action => {
                    if (type === 'action' && action.id === oldId) {
                        return {
                            ...action,
                            id: newEntity.id,
                            isPendingChange: newEntity.isPendingChange
                        };
                    }
                    return action;
                });

                const actionsChanged = stop.actions.some((a, i) => a.id !== updatedActions[i].id || a.isPendingChange !== updatedActions[i].isPendingChange);
                if (actionsChanged) {
                    const updatedStop = { ...stop, actions: updatedActions };
                    if (selectedStop?.id === stop.id) setSelectedStop(updatedStop);
                    return updatedStop;
                }

                return stop;
            })
        })));
    };

    // --- GRANULAR UPDATES (REAL-TIME SYNC) ---
    const handleGranularUpdate = async (type: 'stop' | 'action', entityId: string, payload: any) => {
        try {
            let result: any;
            if (type === 'stop') {
                result = await ordersApi.updateStop(entityId, payload);
                const updatedStop = result.stop;
                if (updatedStop) {
                    syncEntityUpdate('stop', entityId, updatedStop);
                }
            } else {
                result = await ordersApi.updateAction(entityId, payload);
                const updatedAction = result.action;
                if (updatedAction) {
                    syncEntityUpdate('action', entityId, updatedAction);
                }
            }
            // Mark order as modified locally
            setOrder(prev => prev ? { ...prev, hasPendingChanges: true } : null);
            console.log(`[SYNC] ${type} ${entityId} updated successfully`);
        } catch (error: any) {
            console.error(`[SYNC] Failed to update ${type}`, error);
        }
    };

    const handleAddAction = async (stopId: string, payload: any) => {
        try {
            const result = await ordersApi.addAction(stopId, payload);
            const action = result.action;

            // Re-fetch or update local state to get the new action ID
            await fetchOrder(false);
            setOrder(prev => prev ? { ...prev, hasPendingChanges: true } : null);
            return action;
        } catch (error: any) {
            console.error("Failed to add action", error);
            showAlert("Erreur", "Impossible d'ajouter le produit/service.");
            return null;
        }
    };

    const handleDeleteStopInStep = async (stepIdx: number, stopIdx: number) => {
        const step = steps[stepIdx];
        const stopToDelete = step?.stops[stopIdx];
        if (!stopToDelete) return;

        const stopId = stopToDelete.id;
        const isNewStop = stopToDelete.isNew || stopId?.startsWith('temp_');

        // Optimistic UI update
        setSteps(prev => prev.map((s, idx) =>
            idx === stepIdx
                ? {
                    ...s,
                    stops: s.stops.filter((_, i) => i !== stopIdx)
                }
                : s
        ));
        setIsStopDetailOpen(false);
        setSelectedStop(null);
        setSelectedStopMeta(null);
        setOrder(prev => prev ? { ...prev, hasPendingChanges: true } : null);

        // If it's not a new local-only stop, call API
        if (!isNewStop && stopId) {
            try {
                await ordersApi.removeStop(stopId);
            } catch (error: any) {
                console.error("Failed to delete stop", error);
                // Rollback
                setSteps(prev => prev.map((s, idx) =>
                    idx === stepIdx
                        ? {
                            ...s,
                            stops: [...s.stops.slice(0, stopIdx), stopToDelete, ...s.stops.slice(stopIdx)]
                        }
                        : s
                ));
                showAlert("Erreur", "Impossible de supprimer l'arrêt.");
            }
        }
    };

    // Alert Modal State
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
    }>({
        isOpen: false,
        title: '',
        description: ''
    });

    const showAlert = (title: string, description: string) => {
        setAlertConfig({ isOpen: true, title, description });
    };

    const handleAddStep = async () => {
        if (!id) return;

        const newStepIndex = steps.length;
        setDirection(1);

        // Optimistically add step to UI
        const tempStep: PageStep = {
            id: undefined,
            name: `Step ${newStepIndex + 1}`,
            stops: [],
            searchQuery: '',
            isSearchExpanded: false,
            isLinked: false,
            isNew: true
        };
        setSteps(prev => [...prev, tempStep]);
        setActiveStep(newStepIndex);

        try {
            // Call API to create step
            const result = await ordersApi.addStep(id, {
                sequence: newStepIndex,
                linked: false
            });
            const step = result.step || (result as any).entity;

            // Update step with server ID
            setSteps(prev => prev.map((s, idx) =>
                idx === newStepIndex
                    ? { ...s, id: step?.id, isNew: false }
                    : s
            ));
            setOrder(prev => prev ? { ...prev, hasPendingChanges: true } : null);
        } catch (error: any) {
            console.error("Failed to add step", error);
            // Rollback optimistic update
            setSteps(prev => prev.filter((_, idx) => idx !== newStepIndex));
            setActiveStep(Math.max(0, newStepIndex - 1));
            showAlert("Erreur", "Impossible d'ajouter l'étape.");
        }

        if (isSidebarFullscreen) {
            setTimeout(() => {
                if (kanbanRef.current) {
                    kanbanRef.current.scrollTo({
                        left: kanbanRef.current.scrollWidth,
                        behavior: 'smooth'
                    });
                }
            }, 100);
        }
    };

    const scrollToBottom = (stepIdx: number) => {
        setTimeout(() => {
            const container = listRefs.current[stepIdx];
            if (container) {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }, 100);
    };

    const handleAddStop = async (stepIdx: number) => {
        const step = steps[stepIdx];
        if (!step?.id) {
            showAlert("Erreur", "L'étape n'est pas encore enregistrée sur le serveur.");
            return;
        }

        const nextStopIdx = step.stops.length;
        const tempId = `pending_${Date.now()}`;

        // Optimistically add a "pending" stop to the UI
        const pendingStop: Stop = {
            id: tempId,
            type: 'Point',
            typeColor: 'bg-gray-100',
            address: { id: '', name: 'Nouveau point', street: '', city: '', country: '' },
            opening: { start: '08:00', end: '18:00' },
            actions: [],
            client: { name: 'En cours...', avatar: '' },
            isPending: true
        };

        setSteps(prev => prev.map((s, idx) =>
            idx === stepIdx ? { ...s, stops: [...s.stops, pendingStop] } : s
        ));

        const stopPayload = {
            sequence: nextStopIdx,
            address: { street: '', city: '', country: '' },
            actions: []
        };

        try {
            const result = await ordersApi.addStop(step.id, stopPayload);
            const savedStop = result?.stop || result?.entity;

            if (!savedStop) throw new Error("Server returned empty stop");

            // Standardize the server stop to our local PageStop structure
            const newLocalStop: Stop = {
                id: savedStop.id,
                type: (savedStop.actions && savedStop.actions.length > 0)
                    ? (savedStop.actions[0].type === 'PICKUP' ? 'Collecte' : savedStop.actions[0].type === 'DELIVERY' ? 'Livraison' : 'Service')
                    : 'Point',
                typeColor: (savedStop.actions && savedStop.actions.length > 0)
                    ? (savedStop.actions[0].type === 'PICKUP' ? 'bg-orange-50 text-orange-600' : savedStop.actions[0].type === 'DELIVERY' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600')
                    : 'bg-gray-100 text-gray-400',
                address: {
                    id: savedStop.address?.id || '',
                    name: savedStop.address?.label || 'Nouveau point',
                    street: savedStop.address?.street || '',
                    city: savedStop.address?.city || '',
                    country: savedStop.address?.country || ''
                },
                opening: { start: '08:00', end: '18:00' },
                actions: savedStop.actions || [],
                client: { name: 'Client...', avatar: '' }
            };

            // Replace the pending stop with the real one
            setSteps(prev => prev.map((s, idx) =>
                idx === stepIdx
                    ? { ...s, stops: s.stops.map(st => st.id === tempId ? newLocalStop : st) }
                    : s
            ));

            setOrder(prev => prev ? { ...prev, hasPendingChanges: true } : null);

            // Open detail and scroll
            const newStopIdx = steps[stepIdx].stops.length; // Approximate, but will be corrected by refresh
            handleOpenStopDetail(stepIdx, newStopIdx, newLocalStop);
            scrollToBottom(stepIdx);

            // Refresh full order in background to get all calculated fields (ID, etc)
            fetchOrder(false);

        } catch (error: any) {
            console.error("Failed to add stop immediately", error);
            // Remove the pending stop on error
            setSteps(prev => prev.map((s, idx) =>
                idx === stepIdx ? { ...s, stops: s.stops.filter(st => st.id !== tempId) } : s
            ));
            showAlert("Erreur", "Impossible de créer l'arrêt sur le serveur.");
        }
    };

    const handleSearch = (stepIdx: number, value: string) => {
        setSteps(prev => prev.map((s, idx) =>
            idx === stepIdx ? { ...s, searchQuery: value } : s
        ));
    };

    const handleToggleSearch = (stepIdx: number) => {
        setSteps(prev => prev.map((s, idx) =>
            idx === stepIdx ? { ...s, isSearchExpanded: !s.isSearchExpanded, searchQuery: s.isSearchExpanded ? '' : s.searchQuery } : s
        ));
    };

    const handleToggleLink = async (stepIdx: number) => {
        const step = steps[stepIdx];
        const newLinked = !step.isLinked;

        // Optimistic UI update
        setSteps(prev => prev.map((s, idx) =>
            idx === stepIdx ? { ...s, isLinked: newLinked } : s
        ));
        setOrder(prev => prev ? { ...prev, hasPendingChanges: true } : null);

        // Server sync
        if (step.id) {
            try {
                const result = await ordersApi.updateStep(step.id, { linked: newLinked });
                const updatedStep = result.step || (result as any).entity;
                if (updatedStep) {
                    setSteps(prev => prev.map((s, idx) =>
                        idx === stepIdx ? { ...s, id: updatedStep.id } : s
                    ));
                }
            } catch (error) {
                console.error("Failed to sync step link status", error);
                // Rollback
                setSteps(prev => prev.map((s, idx) =>
                    idx === stepIdx ? { ...s, isLinked: step.isLinked } : s
                ));
            }
        }
    };

    const handleDeleteStep = async (stepIdx: number) => {
        if (steps.length <= 1) {
            showAlert("Action impossible", "Au moins une étape est nécessaire pour une commande.");
            return;
        }

        if (steps[stepIdx].stops.length > 0) {
            showAlert("Étape non vide", "Veuillez d'abord supprimer tous les arrêts de cette étape avant de la supprimer.");
            return;
        }

        const stepToDelete = steps[stepIdx];
        const stepId = stepToDelete.id;

        // Optimistic UI update
        const newSteps = steps.filter((_, idx) => idx !== stepIdx);
        setSteps(newSteps);

        setOrder(prev => prev ? { ...prev, hasPendingChanges: true } : null);

        // If step has server ID, call API
        if (stepId) {
            try {
                await ordersApi.removeStep(stepId);
            } catch (error: any) {
                console.error("Failed to delete step", error);
                // Rollback
                setSteps(prev => {
                    const restored = [...prev];
                    restored.splice(stepIdx, 0, stepToDelete);
                    return restored;
                });
                showAlert("Erreur", "Impossible de supprimer l'étape.");
                return;
            }
        }

        // Adjust activeStep and set direction
        if (activeStep >= newSteps.length) {
            setDirection(-1);
            setActiveStep(Math.max(0, newSteps.length - 1));
        } else if (activeStep === stepIdx && stepIdx > 0) {
            setDirection(-1);
            setActiveStep(stepIdx - 1);
        }
    };

    const handleReorderStop = async (stepIdx: number, activeId: string, overId: string) => {
        const step = steps[stepIdx];
        const oldIndex = step.stops.findIndex(c => c.id === activeId);
        const newIndex = step.stops.findIndex(c => c.id === overId);

        if (oldIndex === newIndex) return;

        const newStops = arrayMove(step.stops, oldIndex, newIndex);

        // Optimistic UI update
        setSteps(prev => prev.map((s, idx) => {
            if (idx !== stepIdx) return s;
            return {
                ...s,
                stops: newStops
            };
        }));
        setOrder(prev => prev ? { ...prev, hasPendingChanges: true } : null);

        // Server sync: iterate through affected stops and update sequences
        try {
            await Promise.all(newStops.map((stop, index) => {
                // Only update if sequence actually changed (though index is our source of truth now)
                // For simplicity and to ensure server consistency, we update all in the changed step
                if (stop.id && !stop.id.startsWith('temp_') && !stop.id.startsWith('pending_')) {
                    return ordersApi.updateStop(stop.id, { sequence: index });
                }
                return Promise.resolve();
            }));
        } catch (error) {
            console.error("Failed to sync stop reordering", error);
            // Full refresh to ensure correct state on error
            fetchOrder(false);
        }
    };

    const handleMoveItem = async (stepIdx: number, itemIdx: number, direction: 'up' | 'down') => {
        const step = steps[stepIdx];
        const newIndex = direction === 'up' ? itemIdx - 1 : itemIdx + 1;
        if (newIndex < 0 || newIndex >= step.stops.length) return;

        const newStops = arrayMove(step.stops, itemIdx, newIndex);

        // Optimistic UI update
        setSteps(prev => prev.map((s, idx) => {
            if (idx !== stepIdx) return s;
            return {
                ...s,
                stops: newStops
            };
        }));
        setOrder(prev => prev ? { ...prev, hasPendingChanges: true } : null);

        // Server sync
        try {
            await Promise.all(newStops.map((stop, index) => {
                if (stop.id && !stop.id.startsWith('temp_') && !stop.id.startsWith('pending_')) {
                    return ordersApi.updateStop(stop.id, { sequence: index });
                }
                return Promise.resolve();
            }));
        } catch (error) {
            console.error("Failed to sync stop movement", error);
            fetchOrder(false);
        }
    };

    useEffect(() => {
        const isDraft = order?.status === 'DRAFT';
        const isPending = order && !['DRAFT', 'DELIVERED', 'CANCELLED', 'FAILED'].includes(order.status);

        setHeaderContent(
            <div className="flex items-center justify-between w-full h-full">
                <div className="flex items-center gap-4">
                    <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ChevronLeft size={24} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight">
                            {isDraft ? 'Nouvelle commande' : `Commande #${id?.slice(-6)}`}
                        </h1>
                        {order && (
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${isDraft ? 'bg-yellow-100 text-yellow-700' :
                                order.status === 'PENDING' ? 'bg-blue-100 text-blue-700' :
                                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                        'bg-gray-100 text-gray-600'
                                }`}>
                                {order.status}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isDraft && (
                        <>
                            <button
                                onClick={() => window.history.back()}
                                className="px-5 py-2 text-[11px] font-black text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl uppercase tracking-widest transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-6 py-2 text-[11px] font-black text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-xl uppercase tracking-widest shadow-lg shadow-blue-100 transition-colors flex items-center gap-2"
                            >
                                <Send size={14} />
                                Soumettre
                            </button>
                        </>
                    )}
                    {isPending && order?.hasPendingChanges && (
                        <>
                            <button
                                onClick={handleRevert}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100"
                                title="Annuler les modifications"
                            >
                                <RotateCcw size={18} />
                            </button>
                            <button
                                onClick={handlePushUpdates}
                                className="px-6 py-2 text-[11px] font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl uppercase tracking-widest shadow-lg shadow-emerald-100 transition-colors flex items-center gap-2"
                            >
                                <Check size={14} />
                                Confirmer
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
        return () => clearHeaderContent();
    }, [setHeaderContent, clearHeaderContent, order, id]);


    const livePath = React.useMemo(() => {
        if (!order?.live_route?.geometry) return [];
        return order.live_route.geometry.coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }));
    }, [order?.live_route]);

    const pendingPath = React.useMemo(() => {
        if (!order?.pending_route?.geometry) return [];
        return order.pending_route.geometry.coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }));
    }, [order?.pending_route]);

    const tracePath = React.useMemo(() => {
        if (!order?.actual_trace?.geometry) return [];
        return order.actual_trace.geometry.coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }));
    }, [order?.actual_trace]);

    const routeDetails = React.useMemo(() => {
        const activeRoute = order?.pending_route || order?.live_route;
        if (!activeRoute?.stops) return [];

        return activeRoute.stops.map((s: any) => {
            const stopEntity = steps.flatMap(st => st.stops).find(st => st.id === s.stopId);
            return {
                id: s.sequence + 1,
                location: stopEntity?.address?.name || `Point ${s.sequence + 1}`,
                address: stopEntity?.address?.street || 'Adresse inconnue',
                timing: s.arrival ? `Arrivée +${Math.round(s.arrival / 60)}min` : ''
            };
        });
    }, [order?.pending_route, order?.live_route, steps]);

    const historyStatus: any[] = [];

    const mapMarkers = React.useMemo(() => {
        return steps.flatMap(s => s.stops)
            .filter(s => s.address?.lat && s.address?.lng)
            .map(s => ({
                lat: s.address.lat!,
                lng: s.address.lng!,
                label: s.id.slice(-3)
            }));
    }, [steps]);

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col h-full bg-[#f4f7fa] items-center justify-center font-sans">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={40} className="text-blue-600 animate-spin" />
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                        Chargement de la commande...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#f4f7fa] overflow-hidden font-sans">

            <main className="flex flex-1 overflow-hidden">
                {/* Left Sidebar: Stop List */}
                <aside
                    className={`flex flex-col bg-[#f4f7fa] border-r border-gray-100 px-4 pt-4 pb-2 h-full overflow-hidden transition-all duration-500 ease-in-out relative ${isSidebarFullscreen ? 'w-full' : 'w-[380px]'
                        }`}
                >
                    {/* Absolute Actions in Fullscreen Mode */}
                    {isSidebarFullscreen && (
                        <div className="absolute top-4 right-6 z-50 flex items-center gap-2 bg-white/60 backdrop-blur-xl p-1.5 rounded-[20px] border border-white/40 shadow-xl shadow-blue-900/5">
                            <button
                                onClick={handleAddStep}
                                className="p-2.5 bg-white text-blue-600 rounded-xl border border-gray-100 hover:bg-blue-50 hover:border-blue-100 transition-all shadow-sm flex items-center gap-2 group"
                                title="Add Step"
                            >
                                <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-widest pr-1">Add Step</span>
                            </button>
                            <button
                                onClick={() => setIsSidebarFullscreen(false)}
                                className="p-2.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl transition-all shadow-sm hover:bg-blue-100 group"
                                title="Exit Fullscreen"
                            >
                                <Minimize2 size={18} className="group-scale-90 transition-transform" />
                            </button>
                        </div>
                    )}
                    {/* Step Navigation */}
                    {/* Step Navigation & Actions */}
                    {/* Step Navigation & Actions (Normal Mode only) */}
                    {!isSidebarFullscreen && (
                        <div className="flex items-center justify-between gap-3 mb-4 bg-white/50 p-1.5 rounded-2xl border border-gray-100/50 flex-shrink-0">
                            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1">
                                {steps.map((step, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setDirection(idx > activeStep ? 1 : -1);
                                            setActiveStep(idx);
                                        }}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 group/tab ${activeStep === idx
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                            : 'bg-white/80 text-gray-400 border border-gray-100 hover:border-blue-200 hover:text-blue-500'
                                            }`}
                                    >
                                        <span>{step.name}</span>
                                        {activeStep === idx && steps.length > 1 && (
                                            <X
                                                size={12}
                                                className="hover:text-rose-200 transition-colors"
                                                onClick={(e) => { e.stopPropagation(); handleDeleteStep(idx); }}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200/50">
                                <button
                                    onClick={handleAddStep}
                                    className="p-2 bg-white text-blue-600 rounded-xl border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm"
                                    title="Add Step"
                                >
                                    <Plus size={16} />
                                </button>
                                <button
                                    onClick={() => setIsSidebarFullscreen(!isSidebarFullscreen)}
                                    className="p-2 bg-white text-gray-400 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
                                    title="Fullscreen"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                    <div
                        ref={kanbanRef}
                        className={`flex-1 overflow-hidden ${isSidebarFullscreen ? 'flex flex-row gap-2 overflow-x-auto pb-4 scrollbar-hide px-4 lg:pr-60' : 'flex flex-col'}`}
                    >
                        {isSidebarFullscreen ? (
                            steps.map((step, stepIdx) => (
                                <div key={stepIdx} className="w-[340px] shrink-0 flex flex-col h-full rounded-[32px] bg-white/40 p-1 border border-white/10 hover:bg-white/30 transition-colors">
                                    <div className="flex items-center justify-between p-4 flex-shrink-0">
                                        <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">{step.name}</h3>
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{step.stops.length} stops</span>
                                    </div>

                                    <ListOptions
                                        step={step}
                                        stepIdx={stepIdx}
                                        stopCount={step.stops.length}
                                        totalSteps={steps.length}
                                        onSearch={(val) => handleSearch(stepIdx, val)}
                                        onAdd={() => handleAddStop(stepIdx)}
                                        onToggleSearch={() => handleToggleSearch(stepIdx)}
                                        onToggleLink={() => handleToggleLink(stepIdx)}
                                        onDelete={() => handleDeleteStep(stepIdx)}
                                    />

                                    <div
                                        ref={el => { listRefs.current[stepIdx] = el; }}
                                        className="flex-1 overflow-y-auto scrollbar-hide p-3 pb-32"
                                    >
                                        <StopListWrapper
                                            stops={step.stops}
                                            isLinked={step.isLinked}
                                            onReorder={(activeId, overId) => handleReorderStop(stepIdx, activeId, overId)}
                                            onMoveItem={(idx, dir) => handleMoveItem(stepIdx, idx, dir)}
                                            onOpenDetail={(stop) => {
                                                const stopIdx = step.stops.findIndex(s => s.id === stop.id);
                                                handleOpenStopDetail(stepIdx, stopIdx);
                                            }}
                                        >
                                            {step.stops.length === 0 && (
                                                <div
                                                    onClick={() => handleAddStop(stepIdx)}
                                                    className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-[28px] text-gray-400 m-2 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
                                                >
                                                    <Plus size={24} className="text-gray-300 group-hover:text-blue-400 transition-colors mb-2" />
                                                    <div className="text-[10px] font-black uppercase tracking-widest">Add Stop</div>
                                                </div>
                                            )}
                                        </StopListWrapper>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex-1 flex flex-col relative overflow-hidden">
                                <AnimatePresence initial={false} custom={direction}>
                                    <motion.div
                                        key={activeStep}
                                        custom={direction}
                                        variants={{
                                            enter: (direction: number) => ({
                                                x: direction > 0 ? '100%' : '-100%',
                                                opacity: 0
                                            }),
                                            center: {
                                                x: 0,
                                                opacity: 1
                                            },
                                            exit: (direction: number) => ({
                                                x: direction < 0 ? '100%' : '-100%',
                                                opacity: 0
                                            })
                                        }}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{
                                            x: { type: "spring", stiffness: 300, damping: 30 },
                                            opacity: { duration: 0.2 }
                                        }}
                                        className="absolute inset-0 flex flex-col pt-1"
                                    >
                                        {steps[activeStep] && (
                                            <ListOptions
                                                step={steps[activeStep]}
                                                stepIdx={activeStep}
                                                stopCount={steps[activeStep]?.stops?.length || 0}
                                                totalSteps={steps.length}
                                                onSearch={(val) => handleSearch(activeStep, val)}
                                                onAdd={() => handleAddStop(activeStep)}
                                                onToggleSearch={() => handleToggleSearch(activeStep)}
                                                onToggleLink={() => handleToggleLink(activeStep)}
                                                onDelete={() => handleDeleteStep(activeStep)}
                                            />
                                        )}
                                        <div
                                            ref={el => { listRefs.current[activeStep] = el; }}
                                            className="flex-1 overflow-y-auto scrollbar-hide pb-24 px-1"
                                        >
                                            <StopListWrapper
                                                stops={steps[activeStep]?.stops || []}
                                                isLinked={steps[activeStep]?.isLinked || false}
                                                onReorder={(activeId, overId) => handleReorderStop(activeStep, activeId, overId)}
                                                onMoveItem={(idx, dir) => handleMoveItem(activeStep, idx, dir)}
                                                onOpenDetail={(stop) => {
                                                    if (!steps[activeStep]) return;
                                                    const stopIdx = steps[activeStep].stops.findIndex(s => s.id === stop.id);
                                                    handleOpenStopDetail(activeStep, stopIdx);
                                                }}
                                            >
                                                {steps[activeStep]?.stops?.length === 0 && (
                                                    <div
                                                        onClick={() => handleAddStop(activeStep)}
                                                        className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-[28px] text-gray-400 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
                                                    >
                                                        <Plus size={24} className="text-gray-300 group-hover:text-blue-400 transition-colors mb-2" />
                                                        <div className="text-[10px] font-black uppercase tracking-widest">Add Stop</div>
                                                    </div>
                                                )}
                                            </StopListWrapper>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Main Content Area */}
                <section
                    className={`flex-1 rounded-[16px] overflow-y-auto scrollbar-hide pr-4 py-4 transition-all duration-500 ease-in-out ${isSidebarFullscreen ? 'translate-x-full opacity-0 pointer-events-none w-0 h-0 p-0 overflow-hidden' : 'translate-x-0'
                        }`}
                >
                    {/* Top Row: Map and Route Details */}
                    <div className="flex gap-4 mb-4 items-start">
                        {/* Map Overview */}
                        <div className="flex-1 min-w-0">
                            <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">Map Overview</h2>
                            <div className="w-full h-[400px] rounded-[16px] overflow-hidden border border-gray-100 shadow-sm relative">
                                <GoogleMap
                                    center={mapMarkers[0] || { lat: 48.8566, lng: 2.3522 }}
                                    zoom={12}
                                    className="w-full h-full"
                                >
                                    {mapMarkers.map((m, i) => (
                                        <Marker key={i} position={{ lat: m.lat, lng: m.lng }} label={m.label} />
                                    ))}
                                    {/* Live Route in Blue */}
                                    {visibleLayers.live && (
                                        <Polyline path={livePath} strokeColor="#2563eb" strokeWeight={6} strokeOpacity={0.8} />
                                    )}

                                    {/* Pending Route in Emerald */}
                                    {visibleLayers.pending && order?.hasPendingChanges && (
                                        <Polyline path={pendingPath} strokeColor="#10b981" strokeWeight={4} strokeOpacity={0.9} />
                                    )}

                                    {/* Actual Trace in Green Dashed */}
                                    {visibleLayers.actual && tracePath.length > 0 && (
                                        <Polyline
                                            path={tracePath}
                                            strokeColor="#10b981"
                                            strokeWeight={3}
                                            strokeOpacity={0.6}
                                            // @ts-ignore
                                            icons={[{
                                                icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 2 },
                                                offset: '0',
                                                repeat: '10px'
                                            }]}
                                        />
                                    )}

                                    {/* Real-time Driver Marker */}
                                    {driverLocation && (
                                        <Marker
                                            position={{ lat: driverLocation.lat, lng: driverLocation.lng }}
                                            icon={{
                                                path: typeof window !== 'undefined' ? (window as any).google?.maps?.SymbolPath?.FORWARD_CLOSED_ARROW : undefined,
                                                scale: 6,
                                                fillColor: '#2563eb',
                                                fillOpacity: 1,
                                                strokeWeight: 2,
                                                strokeColor: '#ffffff',
                                                rotation: driverLocation.heading || 0
                                            }}
                                            // @ts-ignore
                                            title={`Chauffeur en direct - Mis à jour à ${new Date(driverLocation.updated_at).toLocaleTimeString()}`}
                                        />
                                    )}
                                </GoogleMap>

                                {/* Route Loading Overlay */}
                                <AnimatePresence>
                                    {isRouteLoading && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-[10] flex items-center justify-center"
                                        >
                                            <div className="bg-white px-4 py-2 rounded-full shadow-lg border border-gray-100 flex items-center gap-3">
                                                <Loader2 className="animate-spin text-blue-600" size={18} />
                                                <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Calcul de l'itinéraire...</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                {/* Map controls overlay */}
                                <div className="absolute right-4 top-4 flex flex-col gap-2">
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
                                            className={`p-2 rounded-lg shadow-md transition-all ${isLayerMenuOpen ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            <Layers size={18} />
                                        </button>

                                        <AnimatePresence>
                                            {isLayerMenuOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                    className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50"
                                                >
                                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 py-2 border-b border-gray-50 mb-1">Affichage Carte</div>

                                                    <button
                                                        onClick={() => setVisibleLayers(prev => ({ ...prev, live: !prev.live }))}
                                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${visibleLayers.live ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                                                    >
                                                        <span className="text-[11px] font-bold">Route Planifiée</span>
                                                        <div className={`w-2 h-2 rounded-full ${visibleLayers.live ? 'bg-blue-600' : 'bg-gray-200'}`} />
                                                    </button>

                                                    <button
                                                        onClick={() => setVisibleLayers(prev => ({ ...prev, pending: !prev.pending }))}
                                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${visibleLayers.pending ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'}`}
                                                    >
                                                        <span className="text-[11px] font-bold">Modifications</span>
                                                        <div className={`w-2 h-2 rounded-full ${visibleLayers.pending ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                                                    </button>

                                                    <button
                                                        onClick={() => setVisibleLayers(prev => ({ ...prev, actual: !prev.actual }))}
                                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${visibleLayers.actual ? 'bg-green-50 text-green-700' : 'text-gray-500 hover:bg-gray-50'}`}
                                                    >
                                                        <span className="text-[11px] font-bold">Tracé Réel</span>
                                                        <div className={`w-2 h-2 rounded-full ${visibleLayers.actual ? 'bg-green-500' : 'bg-gray-200'}`} />
                                                    </button>

                                                    {/* Sources Tooltip */}
                                                    <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                                                        <div className="text-[9px] text-gray-400 font-bold mb-1 uppercase tracking-wider">Sources du tracé</div>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex justify-between items-center text-[10px]">
                                                                <span className="text-gray-500">Prévu:</span>
                                                                <span className="font-mono bg-white px-1 rounded border border-gray-100">{order?.route_metadata?.live_source || '...'}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-[10px]">
                                                                <span className="text-gray-500">Modif.:</span>
                                                                <span className="font-mono bg-white px-1 rounded border border-gray-100">{order?.route_metadata?.pending_source || '...'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <button
                                        onClick={() => fetchRoute({ force: true })}
                                        disabled={isRouteLoading}
                                        className={`p-2 bg-white rounded-lg shadow-md text-gray-600 hover:bg-gray-50 transition-all ${isRouteLoading ? 'opacity-50' : ''}`}
                                        title="Recalculer la route (VROOM)"
                                    >
                                        <RotateCcw size={18} className={isRouteLoading ? 'animate-spin' : ''} />
                                    </button>

                                </div>
                                <div className="absolute right-4 bottom-4">
                                    <button className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 text-gray-600">
                                        <Navigation size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Route & History Tabs */}
                        <div className="w-[340px] shrink-0">
                            <div className="flex items-center gap-4 mb-4 border-b border-gray-100 pb-2">
                                <button
                                    onClick={() => setActiveRouteTab('details')}
                                    className={`text-[11px] font-black uppercase tracking-widest pb-1 transition-all ${activeRouteTab === 'details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Route Details
                                </button>
                                <button
                                    onClick={() => setActiveRouteTab('history')}
                                    className={`text-[11px] font-black uppercase tracking-widest pb-1 transition-all ${activeRouteTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    History Status
                                </button>
                            </div>

                            <div className="bg-[#f4f7fa]/50 rounded-[32px] p-5 border border-gray-50 h-[380px] overflow-y-auto scrollbar-hide">
                                {activeRouteTab === 'details' ? (
                                    routeDetails.length > 0 ? (
                                        <div className="space-y-6 relative">
                                            {/* Route line */}
                                            <div className="absolute left-[11px] top-[10px] bottom-[10px] w-0 border-l-2 border-dashed border-gray-300"></div>

                                            {routeDetails.map((stop: any) => (
                                                <div key={stop.id} className="flex gap-4 relative">
                                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black text-white z-10 shadow-sm">
                                                        {stop.id}
                                                    </div>
                                                    <div className="pt-0.5 flex-1">
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <div className="text-xs font-bold text-gray-900">{stop.location}</div>
                                                            <div className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">{stop.timing}</div>
                                                        </div>
                                                        <div className="text-[10px] font-medium text-gray-400 uppercase line-clamp-1">{stop.address}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-gray-300">
                                                <MapPin size={24} />
                                            </div>
                                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">No route generated</p>
                                            <p className="text-[10px] text-gray-400 font-medium">Add stops to your shipment <br /> to see the journey details.</p>
                                        </div>
                                    )
                                ) : (
                                    historyStatus.length > 0 ? (
                                        <div className="space-y-6 relative">
                                            {/* History Timeline line */}
                                            <div className="absolute left-[11px] top-[10px] bottom-[10px] w-0 border-l-2 border-gray-200"></div>

                                            {historyStatus.map((item, idx) => (
                                                <div key={idx} className="flex gap-4 relative">
                                                    <div className={`flex-shrink-0 w-6 h-6 rounded-lg ${item.bgColor} flex items-center justify-center z-10 shadow-sm`}>
                                                        <item.icon size={12} className={item.iconColor} />
                                                    </div>
                                                    <div className="pt-0.5 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="text-xs font-black text-gray-900">{item.status}</span>
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase">{item.time}</span>
                                                        </div>
                                                        <div className="text-[10px] font-medium text-gray-500 leading-tight">
                                                            {item.description}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-gray-300">
                                                <Clock size={24} />
                                            </div>
                                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">History pending</p>
                                            <p className="text-[10px] text-gray-400 font-medium">Submit the order to <br /> start tracking the status.</p>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Area: Operation Details & Load Analytics */}
                    <div className="flex gap-6 mb-8 items-stretch">
                        {/* Operation Details (Left) */}
                        <div className="flex-1 relative overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Operation Details</h3>
                                <button className="p-2 hover:bg-gray-50 rounded-full text-gray-400"><MoreVertical size={16} /></button>
                            </div>

                            <div className="relative">
                                {/* Side Icons */}
                                <div className="absolute top-0 left-0 flex flex-col gap-3.5 z-20">
                                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shadow-sm shadow-blue-100"><Truck size={18} /></div>
                                    <div className="p-2.5 text-gray-300 hover:text-blue-600 transition-colors cursor-pointer"><Navigation size={18} /></div>
                                    <div className="p-2.5 text-gray-300 hover:text-blue-600 transition-colors cursor-pointer"><Clock size={18} /></div>
                                    <div className="p-2.5 text-gray-300 hover:text-blue-600 transition-colors cursor-pointer"><Settings2 size={18} /></div>
                                </div>

                                {/* Truck Info */}
                                <div className="flex flex-col pt-2">
                                    <div className="flex justify-center mb-6 relative">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-32 bg-blue-100 rounded-full blur-[80px] opacity-30"></div>
                                        <img
                                            src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=800"
                                            alt="Delivery Truck"
                                            className="w-72 h-44 object-contain relative z-10 drop-shadow-2xl brightness-105"
                                        />
                                    </div>

                                    <div className="text-center mb-4">
                                        <h4 className="text-xl font-black text-gray-900 mb-1">{assignedVehicle ? `${assignedVehicle.brand} ${assignedVehicle.model}` : 'Volvo FMX 460'} - <span className="text-blue-600">#{assignedVehicle?.plate || 'XL-43543'}</span></h4>
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="px-2 py-0.5 bg-gray-100 rounded-md text-[9px] font-black text-gray-500 uppercase tracking-tighter">Container ID</span>
                                            <span className="text-[10px] font-mono font-bold text-gray-400">#JAKQHH671</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="bg-[#fff] rounded-2xl p-4 border border-gray-50 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                                                <LayoutGrid size={18} />
                                            </div>
                                            <div>
                                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Container Type</div>
                                                <div className="text-sm font-bold text-gray-900">FLC 20 Standart</div>
                                            </div>
                                        </div>
                                        <div className="bg-[#fff] rounded-2xl p-4 border border-gray-50 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                                                <CheckCircle2 size={18} />
                                            </div>
                                            <div>
                                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Available Load</div>
                                                <div className="text-sm font-bold text-gray-900">{assignedVehicle ? `0kg / ${(assignedVehicle.specs?.maxWeight || 0).toLocaleString()}kg` : '0kg / 0kg'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Driver Card */}
                                    <div className="bg-[#fff] border border-gray-50 rounded-[28px] p-4 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img src={`https://i.pravatar.cc/150?u=${assignedDriver?.driverId || 'none'}`} alt="Driver" className="w-11 h-11 rounded-full border-2 border-white shadow-sm" />
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center border border-gray-50 shadow-sm">
                                                    <div className={`w-2 h-2 ${assignedDriver ? 'bg-emerald-500' : 'bg-gray-300'} rounded-full`}></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-gray-900">{assignedDriver?.driver.fullName || 'No driver auto-selected'}</div>
                                                <div className="text-[10px] font-bold text-gray-400">{assignedDriver ? 'Senior Driver' : 'Status unknown'} • <span className={`${assignedDriver ? 'text-emerald-500' : 'text-gray-400'} uppercase tracking-tighter`}>{assignedDriver ? 'Available' : 'Unavailable'}</span></div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 bg-white border border-gray-100 rounded-full transition-all shadow-sm"><Phone size={15} /></button>
                                            <button className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 bg-white border border-gray-100 rounded-full transition-all shadow-sm"><MessageSquare size={15} /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Weight Distribution (Right) */}
                        <div className="w-[420px] flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Weight Distribution</h3>
                                <button className="p-2 hover:bg-gray-50 rounded-full text-gray-400"><MoreVertical size={16} /></button>
                            </div>

                            <div className="mb-8 px-2 relative">
                                <div className="flex items-baseline gap-2 mb-10">
                                    <span className="text-4xl font-black text-gray-900 tracking-tighter">0%</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">of Total Capacity</span>
                                </div>

                                {/* Capacity Gauge */}
                                <div className="relative mb-8 h-8 flex items-center">
                                    <div className="h-[2px] w-full bg-gray-100 rounded-full relative">
                                        <div className="absolute left-[0%] -translate-x-1/2 -top-6 flex flex-col items-center group/tooltip">
                                            <div className="px-2 py-1 bg-gray-900 rounded-lg text-[10px] font-black text-white mb-1 shadow-xl tracking-tighter">0kg</div>
                                            <div className="w-5 h-5 rounded-full border-4 border-white bg-blue-600 shadow-xl relative z-10 transition-transform hover:scale-110"></div>
                                            <div className="w-[2px] h-4 bg-gray-200 mt-[-2px]"></div>
                                        </div>
                                        <div className="absolute inset-y-0 left-0 bg-blue-600 rounded-full" style={{ width: '0%' }}></div>
                                    </div>
                                </div>

                                {/* Frequency bars */}
                                <div className="flex justify-between h-8 items-end gap-[1px] opacity-10">
                                    {[...Array(60)].map((_, i) => {
                                        const h = 20 + Math.random() * 10;
                                        return (
                                            <div
                                                key={i}
                                                className="w-[2px] rounded-full bg-gray-200"
                                                style={{ height: `${h}%` }}
                                            ></div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex-1 space-y-0.5">
                                <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2 px-2 mb-2">
                                    <span>Load Type</span>
                                    <span>Weight (g)</span>
                                </div>

                                <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-3xl text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                    No items in load
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <ConfirmModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                description={alertConfig.description}
                confirmLabel="OK"
                showCancel={false}
            />

            <StopDetailPanel
                isOpen={isStopDetailOpen}
                onClose={handleCloseStopDetail}
                stop={selectedStop}
                orderId={id}
                availableTransitItems={order?.transitItems || []}
                onUpdate={async (newStop, fieldPath, value) => {
                    if (!selectedStopMeta) return;
                    const { stepIdx, stopIdx } = selectedStopMeta;

                    // Update local state first (Optimistic)
                    setSteps(prev => prev.map((s, sIdx) =>
                        sIdx === stepIdx
                            ? {
                                ...s,
                                stops: s.stops.map((st, stIdx) =>
                                    stIdx === stopIdx ? { ...newStop, isModified: true } : st
                                )
                            }
                            : s
                    ));
                    setSelectedStop(newStop);

                    // Sync to server
                    let payload: any = {};
                    if (fieldPath) {
                        // Build nested object from fieldPath
                        const parts = fieldPath.split('.');
                        let current = payload;
                        for (let i = 0; i < parts.length - 1; i++) {
                            current[parts[i]] = {};
                            current = current[parts[i]];
                        }
                        current[parts[parts.length - 1]] = value;
                    } else {
                        // Fallback to minimal full payload if no fieldPath provided
                        payload = {
                            address: newStop.address,
                            client: newStop.client,
                            metadata: newStop.metadata
                        };
                    }

                    await handleGranularUpdate('stop', newStop.id, payload);
                }}
                onUpdateAction={async (actionId, data) => {
                    // Map local action back to API (snake_case)
                    const payload = {
                        type: data.type,
                        quantity: data.quantity,
                        transit_item_id: data.transitItemId,
                        service_time: (data.service_time || 0) * 60,
                        confirmation_rules: data.confirmation,
                        metadata: {
                            productName: data.productName,
                            productDescription: data.productDescription,
                            unitaryPrice: data.unitaryPrice,
                            packagingType: data.packagingType,
                            weight: data.weight,
                            dimensions: data.dimensions
                        }
                    };
                    await handleGranularUpdate('action', actionId, payload);
                }}
                onAddAction={async (stopId, type) => {
                    const payload = {
                        type: type || 'service',
                        quantity: 1,
                        service_time: 600
                    };
                    return await handleAddAction(stopId, payload);
                }}
                onDelete={() => {
                    if (selectedStopMeta) {
                        handleDeleteStopInStep(selectedStopMeta.stepIdx, selectedStopMeta.stopIdx);
                    }
                }}
            />

            <ConfirmModal
                isOpen={showRevertModal}
                onClose={() => setShowRevertModal(false)}
                onConfirm={executeRevert}
                title="Annuler les modifications ?"
                description="Toutes les modifications en attente seront définitivement perdues. Cette action est irréversible."
                confirmLabel="Annuler les modifications"
                confirmVariant="danger"
            />

            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
