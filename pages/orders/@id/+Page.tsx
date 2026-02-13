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
    Layers,
    MapPinPlus,
    ArrowUpRight,
    ArrowDownLeft,
    Wrench,
    Package,
    Flag
} from 'lucide-react';
import { arrayMove } from '@dnd-kit/sortable';
import ListOptions from './components/ListOptions';
import StopListWrapper from './components/StopListWrapper';
import { MapLibre as GoogleMap, Marker, Polyline, MarkerPopup, MarkerClusterer, useMap } from '../../../components/MapLibre';
import { useHeader } from '../../../context/HeaderContext';
import { useTheme } from '../../../context/ThemeContext';
import { ConfirmModal } from '../../../components/ConfirmModal';
import LocationSearchBar from '../../../components/LocationSearchBar';
import StopDetailPanel from './components/StopDetailPanel';
import { ordersApi, Order, Step as ApiStep, ValidationIssue } from '../../../api/orders';
import { driverService } from '../../../api/drivers';
import { fleetService } from '../../../api/fleet';
import { trackingApi } from '../../../api/tracking';
import { User as UserType, CompanyDriverSetting, Vehicle } from '../../../api/types';
import { socketClient } from '../../../api/socket';

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

// --- HELPER COMPONENTS ---
const ViewportSync: React.FC<{ onSync: (viewport: { center: { lat: number; lng: number }; zoom: number }) => void }> = ({ onSync }) => {
    const { map, isLoaded } = useMap();
    useEffect(() => {
        if (!isLoaded || !map) return;
        const handleIdle = () => {
            const center = map.getCenter();
            onSync({
                center: { lat: center.lat, lng: center.lng },
                zoom: map.getZoom()
            });
        };
        map.on('idle', handleIdle);
        return () => { map.off('idle', handleIdle); };
    }, [map, isLoaded, onSync]);
    return null;
};

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
    const { resolvedTheme } = useTheme();

    const [activeStep, setActiveStep] = useState(0);
    const [isRouteLoading, setIsRouteLoading] = useState(false);
    const [direction, setDirection] = useState(0);
    const [isSidebarFullscreen, setIsSidebarFullscreen] = useState(false);
    const [activeRouteTab, setActiveRouteTab] = useState<'details' | 'history'>('details');
    const [activeRightPanel, setActiveRightPanel] = useState<'route' | 'history' | 'operation' | 'weight' | 'items' | null>(null);
    const handleRightPanelToggle = (panel: 'route' | 'history' | 'operation' | 'weight' | 'items') => {
        setActiveRightPanel(prev => prev === panel ? null : panel);
    };
    const [visibleLayers, setVisibleLayers] = useState({
        live: true,
        pending: true,
        actual: true,
        auto: true
    });
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Auto-layer logic based on order state
    useEffect(() => {
        if (visibleLayers.auto && order) {
            const hasChanges = order.hasPendingChanges;
            setVisibleLayers(prev => ({
                ...prev,
                live: !hasChanges,
                pending: !!hasChanges,
                actual: false
            }));
        }
    }, [visibleLayers.auto, order?.hasPendingChanges]);

    const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
    const { setHeaderContent, clearHeaderContent, headerHeight, setHeaderHidden } = useHeader();
    const listRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
    const lastScrollYList = useRef(0);
    const kanbanRef = useRef<HTMLDivElement | null>(null);

    const handleListScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (!isSidebarFullscreen) return;
        const currentScrollY = e.currentTarget.scrollTop;
        if (currentScrollY > lastScrollYList.current && currentScrollY > 50) {
            setHeaderHidden(true);
        } else if (currentScrollY < lastScrollYList.current) {
            setHeaderHidden(false);
        }
        lastScrollYList.current = currentScrollY;
    };

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

    // --- MAP PERSISTENCE & CREATIVE MODE ---
    const [isCreativeMode, setIsCreativeMode] = useState(false);
    const [mapViewport, setMapViewport] = useState<{ center: { lat: number; lng: number }; zoom: number }>({
        center: { lat: 5.3486, lng: -4.0305 }, // Abidjan default
        zoom: 12
    });

    const activeStepRef = useRef(activeStep);
    useEffect(() => { activeStepRef.current = activeStep; }, [activeStep]);

    // --- SOCKET.IO REAL-TIME UPDATES ---
    useEffect(() => {
        if (!id || !socketClient) return;

        // Ensure connected
        const socket = socketClient.connect();

        const handleUpdate = (data: any) => {
            console.log("[SOCKET] Received update event:", data);
            if (data.orderId === id) {
                fetchOrder(false); // Silent refresh
            }
        };

        const handleRouteUpdate = (data: any) => {
            console.log("[SOCKET] Received route update event:", data);
            if (data.orderId === id) {
                fetchRoute({ silent: true });
            }
        };

        // Join the room for this order
        socket.emit('join', `order:${id}`);

        // Listen for events
        socket.on('order_updated', handleUpdate);
        socket.on('route_updated', handleRouteUpdate);

        return () => {
            socket.off('order_updated', handleUpdate);
            socket.off('route_updated', handleRouteUpdate);
        };
    }, [id, socketClient]);

    // Save map viewport to localStorage when it changes (Debounced)
    useEffect(() => {
        if (!id) return;

        const timer = setTimeout(() => {
            localStorage.setItem(`map_view_${id}`, JSON.stringify(mapViewport));
        }, 500);

        return () => clearTimeout(timer);
    }, [id, mapViewport]);

    // Save map layers to localStorage when it changes
    useEffect(() => {
        if (!id) return;
        localStorage.setItem('map_layers_auto', JSON.stringify(visibleLayers.auto));
    }, [id, visibleLayers.auto]);

    // Load saved settings
    useEffect(() => {
        if (!id) return;

        const savedAuto = localStorage.getItem('map_layers_auto');
        if (savedAuto !== null) {
            try {
                const autoValue = JSON.parse(savedAuto);
                setVisibleLayers(prev => ({ ...prev, auto: autoValue }));
            } catch (e) {
                console.error("Failed to parse saved map auto mode", e);
            }
        }

        const saved = localStorage.getItem(`map_view_${id}`);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.center && typeof parsed.zoom === 'number') {
                    setMapViewport(parsed);
                    return;
                }
            } catch (e) {
                console.error("Failed to parse saved map view", e);
            }
        }

        // No saved view or error -> Try GPS
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setMapViewport({
                        center: { lat: pos.coords.latitude, lng: pos.coords.longitude },
                        zoom: 14
                    });
                },
                (err) => {
                    console.warn("Geolocation failed or denied", err);
                },
                { timeout: 5000 }
            );
        }
    }, [id]);

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
            fetchRoute({ silent: !showLoading });
        } catch (error) {
            console.error("Failed to fetch order", error);
            showAlert("Erreur", "Impossible de charger les détails de la commande.");
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    const fetchRoute = async (options: { force?: boolean, silent?: boolean } = {}) => {
        if (!id) return;
        if (!options.silent) setIsRouteLoading(true);
        try {
            const routeData = await ordersApi.getRoute(id, ['live', 'pending', 'trace'], { force: options.force });
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
            if (!options.silent) setIsRouteLoading(false);
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
                    display_order: stIdx,
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

    const handleAddStop = async (stepIdx: number, coordinates?: { lat: number, lng: number }) => {
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

        const stopPayload: any = {
            display_order: nextStopIdx,
            address: { street: '', city: '', country: '' },
            coordinates: coordinates ? [coordinates.lat, coordinates.lng] as [number, number] : undefined,
            actions: [],
            reverse_geocode: !!coordinates,
            add_default_service: !!coordinates
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
            if (!coordinates) {
                const newStopIdx = steps[stepIdx].stops.length; // Approximate, but will be corrected by refresh
                handleOpenStopDetail(stepIdx, newStopIdx, newLocalStop);
            }
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

        // Server sync: iterate through affected stops and update display_order
        try {
            await Promise.all(newStops.map((stop, index) => {
                // Only update if display_order actually changed (index is our source of truth)
                // For simplicity and to ensure server consistency, we update all in the changed step
                if (stop.id && !stop.id.startsWith('temp_') && !stop.id.startsWith('pending_')) {
                    return ordersApi.updateStop(stop.id, { display_order: index });
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
                    return ordersApi.updateStop(stop.id, { display_order: index });
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
            <div className="flex items-center justify-between w-full h-full gap-4">
                <div className="flex items-center gap-3 overflow-hidden">
                    <button
                        onClick={() => window.history.back()}
                        className="p-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 hover:text-emerald-600 rounded-xl shadow-sm transition-all shrink-0"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="overflow-hidden">
                        <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight truncate">
                            {isDraft ? 'Nouvelle mission' : `Commande #${id?.slice(-6)}`}
                        </h1>
                        <div className="flex items-center gap-2">
                            {order && (
                                <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${isDraft ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                                    order.status === 'PENDING' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                                        order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                            'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                    }`}>
                                    {order.status}
                                </span>
                            )}
                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate hidden sm:block">
                                {order?.refId || 'Mission Standard'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {isDraft && (
                        <>
                            <button
                                onClick={() => window.history.back()}
                                className="px-4 py-2 text-[10px] font-black text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl uppercase tracking-widest transition-colors hidden sm:block"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-5 py-2.5 text-[10px] font-black text-white bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-xl uppercase tracking-widest shadow-lg shadow-emerald-200/50 dark:shadow-none transition-all flex items-center gap-2"
                            >
                                <Send size={14} />
                                <span className="hidden sm:inline">Soumettre</span>
                                <span className="sm:hidden">OK</span>
                            </button>
                        </>
                    )}
                    {isPending && order?.hasPendingChanges && (
                        <>
                            <button
                                onClick={handleRevert}
                                className="p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors border border-transparent hover:border-rose-100 dark:hover:border-rose-500/20"
                                title="Annuler les modifications"
                            >
                                <RotateCcw size={18} />
                            </button>
                            <button
                                onClick={handlePushUpdates}
                                className="px-5 py-2.5 text-[10px] font-black text-white bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-xl uppercase tracking-widest shadow-lg shadow-emerald-200/50 dark:shadow-none transition-all flex items-center gap-2"
                            >
                                <Check size={14} />
                                <span className="hidden sm:inline">Confirmer</span>
                                <span className="sm:hidden">OK</span>
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
                id: (s.execution_order ?? s.display_order) + 1,
                location: stopEntity?.address?.name || `Point ${(s.execution_order ?? s.display_order) + 1}`,
                address: stopEntity?.address?.street || 'Adresse inconnue',
                timing: s.arrival ? `Arrivée +${Math.round(s.arrival / 60)}min` : ''
            };
        });
    }, [order?.pending_route, order?.live_route, steps]);

    const historyStatus: any[] = [];

    const mapMarkers = React.useMemo(() => {
        const allStops = steps.flatMap((s, stepIdx) =>
            s.stops.map((stop, stopIdx) => ({ stop, stepIdx, stopIdx }))
        );

        let globalStopCounter = 0;

        return allStops
            .filter(({ stop }) => stop.address?.lat && stop.address?.lng)
            .map(({ stop, stepIdx, stopIdx }) => {
                const pickupQty = stop.actions?.filter((a: any) => a.type?.toLowerCase() === 'pickup').reduce((acc: number, a: any) => acc + (Number(a.quantity) || 0), 0) || 0;
                const deliveryQty = stop.actions?.filter((a: any) => a.type?.toLowerCase() === 'delivery').reduce((acc: number, a: any) => acc + (Number(a.quantity) || 0), 0) || 0;
                const serviceQty = stop.actions?.filter((a: any) => a.type?.toLowerCase() === 'service').reduce((acc: number, a: any) => acc + (Number(a.quantity) || 0), 0) || 0;

                globalStopCounter++;
                const isStart = globalStopCounter === 1;
                const isEnd = globalStopCounter === allStops.length;

                return {
                    lat: stop.address.lat!,
                    lng: stop.address.lng!,
                    label: globalStopCounter.toString(),
                    stop,
                    stepIdx,
                    stopIdx,
                    pickupQty,
                    deliveryQty,
                    serviceQty,
                    isStart,
                    isEnd,
                    addressSnippet: (stop.address.city || stop.address.street || stop.address.name || '...').slice(0, 15)
                };
            });
    }, [steps]);

    const clusterPoints = React.useMemo(() => {
        return mapMarkers.map(m => ({
            lat: m.lat,
            lng: m.lng,
            id: m.stop.id,
            properties: { marker: m }
        }));
    }, [mapMarkers]);

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col h-full bg-[#f4f7fa] dark:bg-slate-950 items-center justify-center font-sans transition-colors duration-500">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={40} className="text-blue-600 animate-spin" />
                    <p className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                        Chargement de la commande...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-[#f4f7fa] dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-500 text-slate-900 dark:text-slate-100">

            <main className="relative w-full h-full overflow-hidden">
                {/* Left Sidebar: Stop List (Floating Island) */}
                <aside
                    className={`absolute left-4 z-40 flex flex-col bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl px-4 pt-4 pb-2 rounded-[24px] border border-white/20 dark:border-slate-800 shadow-2xl transition-all duration-500 ease-in-out pointer-events-auto ${isSidebarFullscreen ? 'right-4 !top-4 !left-6' : isSidebarCollapsed ? 'w-20' : 'w-[380px]'
                        }`}
                    style={{
                        top: isSidebarFullscreen ? '16px' : `${headerHeight}px`,
                        bottom: '16px'
                    }}
                >
                    {/* Toggle Button for Sidebar Collapse */}
                    {!isSidebarFullscreen && (
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="absolute -right-3 top-10 w-6 h-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-white/20 dark:border-slate-700 rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                        >
                            <ChevronLeft size={16} className={`transition-transform duration-500 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
                        </button>
                    )}

                    {/* Absolute Actions in Fullscreen Mode */}
                    {isSidebarFullscreen && (
                        <div className="absolute top-4 right-6 z-50 flex items-center gap-2 bg-white/45 dark:bg-slate-900/45 backdrop-blur-2xl p-1.5 rounded-[20px] border border-white/40 shadow-xl shadow-blue-900/5">
                            <button
                                onClick={handleAddStep}
                                className="p-2.5 bg-white dark:bg-slate-900 text-blue-600 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-blue-50 hover:border-blue-100 transition-all shadow-sm flex items-center gap-2 group"
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
                        <div className={`flex items-center justify-between gap-3 mb-4 bg-white/30 dark:bg-slate-900/40 p-1.5 rounded-2xl border border-white/10 dark:border-slate-800 shadow-sm flex-shrink-0 transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
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
                                            : 'bg-white dark:bg-slate-900/80 text-gray-400 border border-gray-100 dark:border-slate-800 hover:border-blue-200 hover:text-blue-500'
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

                            <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200/50 dark:border-slate-800">
                                <button
                                    onClick={handleAddStep}
                                    className="p-2 bg-white dark:bg-slate-900 text-blue-600 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 transition-all shadow-sm"
                                    title="Add Step"
                                >
                                    <Plus size={16} />
                                </button>
                                <button
                                    onClick={() => setIsSidebarFullscreen(!isSidebarFullscreen)}
                                    className="p-2 bg-white dark:bg-slate-900 text-gray-400 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                                    title="Fullscreen"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                    <div
                        ref={kanbanRef}
                        className={`flex-1 overflow-hidden transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'} ${isSidebarFullscreen ? 'flex flex-row gap-2 overflow-x-auto pb-4 scrollbar-hide px-4 lg:pr-60' : 'flex flex-col'}`}
                    >
                        {isSidebarFullscreen ? (
                            steps.map((step, stepIdx) => (
                                <div key={stepIdx} className="w-[340px] shrink-0 flex flex-col h-full rounded-[32px] bg-white dark:bg-slate-900/60 p-1 border border-white/10 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-900/80 transition-colors">
                                    <div className="flex items-center justify-between p-4 flex-shrink-0">
                                        <h3 className="text-[11px] font-black text-gray-900 dark:text-slate-100 uppercase tracking-widest">{step.name}</h3>
                                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full">{step.stops.length} stops</span>
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
                                            onScroll={handleListScroll}
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

                {/* Main Content Area - Full Map (Background) */}
                <section
                    className="absolute inset-0 z-0 overflow-hidden"
                >
                    {/* Full-size Map Background */}
                    <div className="absolute inset-0 overflow-hidden">
                        <GoogleMap
                            center={mapViewport.center}
                            zoom={mapViewport.zoom}
                            onClick={(e) => {
                                if (isCreativeMode && e.latLng) {
                                    handleAddStop(activeStepRef.current, e.latLng);
                                }
                            }}
                            className="w-full h-full"
                            // @ts-ignore
                            cursor={isCreativeMode ? 'crosshair' : 'default'}
                            // @ts-ignore
                            theme={resolvedTheme}
                            projection="globe"
                        >
                            <ViewportSync onSync={setMapViewport} />

                            {/* Primary Location Search Bar */}
                            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4 pointer-events-auto">
                                <LocationSearchBar
                                    placeholder="Rechercher un lieu..."
                                    onLocationSelect={(loc) => {
                                        setMapViewport({ center: { lat: loc.lat, lng: loc.lng }, zoom: 15 });
                                    }}
                                />
                            </div>

                            <MarkerClusterer points={clusterPoints}>
                                {(clusters, supercluster, map) => clusters.map((cluster) => {
                                    const [longitude, latitude] = cluster.geometry.coordinates;
                                    const { cluster: isCluster, point_count: pointCount } = cluster.properties;

                                    if (isCluster) {
                                        return (
                                            <Marker
                                                key={`cluster-${cluster.id}`}
                                                position={{ lat: latitude, lng: longitude }}
                                                icon={null}
                                                label={
                                                    <div className="relative flex items-center justify-center cursor-pointer group">
                                                        {/* Halo Effect - Pulsing Rings */}
                                                        <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping duration-[3000ms]" />
                                                        <div className="absolute -inset-2 rounded-full bg-blue-500/10 animate-pulse duration-[2000ms] blur-sm" />

                                                        {/* Static Glow */}
                                                        <div className="absolute -inset-1 rounded-full bg-blue-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />

                                                        {/* Main Circle Cluster */}
                                                        <div className="relative flex items-center justify-center bg-blue-600 dark:bg-blue-500 text-white rounded-full w-10 h-10 border-2 border-white dark:border-slate-800 shadow-[0_0_20px_rgba(37,99,235,0.5)] font-black text-sm transition-all group-hover:scale-110 group-active:scale-95 group-hover:bg-blue-700">
                                                            {pointCount}
                                                        </div>
                                                    </div>
                                                }
                                                // @ts-ignore
                                                onClick={() => {
                                                    const expansionZoom = Math.min(
                                                        supercluster.getClusterExpansionZoom(cluster.id as number),
                                                        18
                                                    );
                                                    map.flyTo({
                                                        center: [longitude, latitude],
                                                        zoom: expansionZoom,
                                                        speed: 1.2,
                                                        curve: 1.42
                                                    });
                                                }}
                                            />
                                        );
                                    }

                                    const m = cluster.properties.marker;
                                    return (
                                        <Marker
                                            key={m.stop.id}
                                            position={{ lat: m.lat, lng: m.lng }}
                                            label={
                                                <div className={`flex flex-col items-center shadow-lg animate-in fade-in zoom-in duration-300`}>
                                                    {/* Badge for quantities */}
                                                    {(m.pickupQty > 0 || m.deliveryQty > 0 || m.serviceQty > 0) && (
                                                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-t-xl border-x border-t border-gray-100 dark:border-slate-800">
                                                            {m.pickupQty > 0 && (
                                                                <div className="flex items-center gap-0.5 text-[10px] font-black text-orange-600 dark:text-orange-400">
                                                                    <ArrowUpRight size={10} />
                                                                    <span>{m.pickupQty}</span>
                                                                </div>
                                                            )}
                                                            {m.deliveryQty > 0 && (
                                                                <div className="flex items-center gap-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                                                                    <ArrowDownLeft size={10} />
                                                                    <span>{m.deliveryQty}</span>
                                                                </div>
                                                            )}
                                                            {m.serviceQty > 0 && (
                                                                <div className="flex items-center gap-0.5 text-[10px] font-black text-blue-600 dark:text-blue-400">
                                                                    <Wrench size={10} />
                                                                    <span>{m.serviceQty}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {/* Stop Marker Body */}
                                                    <div className={`relative px-2 py-1 flex items-center gap-2 rounded-b-xl border-b border-x border-gray-100 dark:border-slate-800 
                                                        ${m.isStart ? 'bg-emerald-600 text-white min-w-[40px] justify-center rounded-xl border-0 !text-xs ring-4 ring-emerald-500/20' :
                                                            m.isEnd ? 'bg-rose-600 text-white min-w-[40px] justify-center rounded-xl border-0 !text-xs ring-4 ring-rose-500/20' :
                                                                'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800'}`}>

                                                        {/* Sequence Number */}
                                                        <span className={`text-[11px] font-black ${m.isStart || m.isEnd ? 'text-white' : 'text-blue-600'}`}>
                                                            {m.label}
                                                        </span>

                                                        {/* Address Snippet (hidden for start/end if too large maybe?) */}
                                                        <span className={`text-[9px] font-bold uppercase tracking-tighter whitespace-nowrap border-l border-gray-100 dark:border-slate-800 pl-2
                                                            ${m.isStart || m.isEnd ? 'text-white border-white/20' : 'text-gray-500 dark:text-slate-400'}`}>
                                                            {m.addressSnippet}
                                                        </span>

                                                        {/* Visual indicator for Start/End */}
                                                        {m.isStart && <Navigation size={10} className="fill-white" />}
                                                        {m.isEnd && <Flag size={10} className="fill-white" />}
                                                    </div>
                                                </div>
                                            }
                                            onClick={() => handleOpenStopDetail(m.stepIdx, m.stopIdx, m.stop)}
                                        >
                                            <MarkerPopup className="w-64 overflow-hidden !p-0 rounded-2xl border-0 shadow-2xl animate-in fade-in zoom-in duration-200">
                                                <div className="flex flex-col bg-white dark:bg-slate-900">
                                                    <div className="bg-blue-600 p-3 text-white">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <div className="text-[10px] font-black uppercase tracking-widest opacity-70">
                                                                Arrêt {m.label}
                                                            </div>
                                                            {m.stop.status && (
                                                                <div className="text-[9px] font-bold bg-white/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                                    {m.stop.status}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="font-bold truncate text-sm">
                                                            {m.stop.client?.name || 'Client Sans Nom'}
                                                        </div>
                                                    </div>

                                                    <div className="p-3 space-y-3">
                                                        <div className="flex items-start gap-2 text-gray-500 dark:text-slate-400">
                                                            <MapPin size={14} className="mt-0.5 shrink-0" />
                                                            <p className="text-[11px] leading-relaxed line-clamp-2">
                                                                {m.stop.address.street}, {m.stop.address.city}
                                                            </p>
                                                        </div>

                                                        <div className="flex flex-wrap gap-1.5 border-t border-gray-50 dark:border-slate-800 pt-3">
                                                            {m.stop.actions?.map((action: any, idx: number) => (
                                                                <div key={idx} className="flex items-center gap-1 bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                                                    <div className={`p-0.5 rounded ${action.type === 'pickup' ? 'text-orange-600' : action.type === 'delivery' ? 'text-emerald-600' : 'text-blue-600'}`}>
                                                                        {action.type === 'pickup' ? <ArrowUpRight size={10} /> : action.type === 'delivery' ? <ArrowDownLeft size={10} /> : <Wrench size={10} />}
                                                                    </div>
                                                                    <span className="text-[10px] font-bold text-gray-700 dark:text-slate-300">
                                                                        {action.type === 'service' ? `${action.service_time || 10}'` : `x${action.quantity}`}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenStopDetail(m.stepIdx, m.stopIdx, m.stop);
                                                            }}
                                                            className="w-full py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black rounded-xl transition-all border border-blue-100/50 dark:border-blue-900/10 uppercase tracking-widest hover:bg-blue-100 dark:hover:bg-blue-900/50"
                                                        >
                                                            Éditer l'arrêt
                                                        </button>
                                                    </div>
                                                </div>
                                            </MarkerPopup>
                                        </Marker>
                                    );
                                })}
                            </MarkerClusterer>
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
                                    className="absolute inset-0 bg-white/10 dark:bg-slate-900/40 backdrop-blur-md z-[10] flex items-center justify-center"
                                >
                                    <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-full shadow-lg border border-gray-100 dark:border-slate-800 flex items-center gap-3">
                                        <Loader2 className="animate-spin text-blue-600" size={18} />
                                        <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Calcul de l'itinéraire...</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Map controls overlay (top-left, shifted right of sidebar) */}
                    <div
                        className="absolute z-[20] flex flex-col gap-2 transition-all duration-500 ease-in-out"
                        style={{
                            top: `${headerHeight}px`,
                            left: isSidebarFullscreen ? 'calc(100% - 60px)' : (isSidebarCollapsed ? '112px' : '412px')
                        }}
                    >
                        <div className="relative">
                            <AnimatePresence>
                                {isLayerMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        className="absolute left-0 top-12 w-48 bg-white/20 dark:bg-slate-900/40 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-800 p-2 z-50"
                                    >
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 py-2 border-b border-gray-50 mb-1">Affichage Carte</div>

                                        <button
                                            onClick={() => setVisibleLayers(prev => ({ ...prev, auto: !prev.auto }))}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors mb-1 ${visibleLayers.auto ? 'bg-orange-50 text-orange-700' : 'text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            <div className="flex flex-col items-start">
                                                <span className="text-[11px] font-bold">Mode Auto</span>
                                                <span className="text-[9px] opacity-60">Gestion intelligente</span>
                                            </div>
                                            <div className={`w-2 h-2 rounded-full ${visibleLayers.auto ? 'bg-orange-500 animate-pulse' : 'bg-gray-200'}`} />
                                        </button>

                                        <div className="h-px bg-gray-100 dark:bg-slate-800 my-1 mx-2"></div>

                                        <button
                                            onClick={() => setVisibleLayers(prev => ({ ...prev, live: !prev.live, auto: false }))}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${visibleLayers.live ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            <span className="text-[11px] font-bold">Route Planifiée</span>
                                            <div className={`w-2 h-2 rounded-full ${visibleLayers.live ? 'bg-blue-600' : 'bg-gray-200'}`} />
                                        </button>

                                        <button
                                            onClick={() => setVisibleLayers(prev => ({ ...prev, pending: !prev.pending, auto: false }))}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${visibleLayers.pending ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            <span className="text-[11px] font-bold">Modifications</span>
                                            <div className={`w-2 h-2 rounded-full ${visibleLayers.pending ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                                        </button>

                                        <button
                                            onClick={() => setVisibleLayers(prev => ({ ...prev, actual: !prev.actual, auto: false }))}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${visibleLayers.actual ? 'bg-green-50 text-green-700' : 'text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            <span className="text-[11px] font-bold">Tracé Réel</span>
                                            <div className={`w-2 h-2 rounded-full ${visibleLayers.actual ? 'bg-green-500' : 'bg-gray-200'}`} />
                                        </button>

                                        {/* Sources Tooltip */}
                                        <div className="mt-2 p-2 bg-white/10 dark:bg-slate-800/40 rounded-lg border border-white/10 dark:border-slate-800">
                                            <div className="text-[9px] text-gray-400 font-bold mb-1 uppercase tracking-wider">Sources du tracé</div>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="text-gray-500">Prévu:</span>
                                                    <span className="font-mono bg-white dark:bg-slate-900 px-1 rounded border border-gray-100 dark:border-slate-800">{order?.route_metadata?.live_source || '...'}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="text-gray-500">Modif.:</span>
                                                    <span className="font-mono bg-white dark:bg-slate-900 px-1 rounded border border-gray-100 dark:border-slate-800">{order?.route_metadata?.pending_source || '...'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <button
                            onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
                            className={`p-2 rounded-lg shadow-md transition-all ${isLayerMenuOpen ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 text-gray-600 hover:bg-gray-50'}`}
                            title="Couches de la carte"
                        >
                            <Layers size={18} />
                        </button>

                        <button
                            onClick={() => setIsCreativeMode(!isCreativeMode)}
                            className={`p-2 rounded-lg shadow-md transition-all ${isCreativeMode ? 'bg-orange-500 text-white animate-pulse' : 'bg-white dark:bg-slate-900 text-gray-600 hover:bg-gray-50'}`}
                            title={isCreativeMode ? "Désactiver le Mode Créatif" : "Activer le Mode Créatif (cliquer sur la carte pour ajouter un stop)"}
                        >
                            <MapPinPlus size={18} />
                        </button>
                        <button
                            onClick={() => fetchRoute({ force: true })}
                            disabled={isRouteLoading}
                            className={`p-2 bg-white dark:bg-slate-900 rounded-lg shadow-md text-gray-600 hover:bg-gray-50 transition-all ${isRouteLoading ? 'opacity-50' : ''}`}
                            title="Recalculer la route (VROOM)"
                        >
                            <RotateCcw size={18} className={isRouteLoading ? 'animate-spin' : ''} />
                        </button>
                        <button className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-md hover:bg-gray-50 text-gray-600">
                            <Navigation size={18} />
                        </button>
                    </div>

                    {/* RIGHT SIDE: Icon Bar + Expandable Panel */}
                    <div
                        className="absolute right-4 bottom-4 z-[15] flex items-stretch gap-3 pointer-events-auto transition-all duration-500"
                        style={{ top: `${headerHeight}px` }}
                    >

                        {/* Expandable Panel (conditionally shown) */}
                        <AnimatePresence>
                            {activeRightPanel && (
                                <motion.div
                                    key="right-panel"
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 372, opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    className="overflow-hidden flex flex-col p-4"
                                >
                                    <div className="bg-white/20 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[24px] border border-white/20 dark:border-slate-800 shadow-2xl shadow-black/15 p-5 flex flex-col h-full w-[340px] overflow-hidden">
                                        {/* Panel Header */}
                                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200/40 dark:border-slate-700/40 flex-shrink-0">
                                            <h3 className="text-[11px] font-black text-gray-700 dark:text-slate-200 uppercase tracking-widest">
                                                {activeRightPanel === 'route' && 'Route Details'}
                                                {activeRightPanel === 'history' && 'History Status'}
                                                {activeRightPanel === 'operation' && 'Operation Details'}
                                                {activeRightPanel === 'weight' && 'Weight Distribution'}
                                            </h3>
                                            <button
                                                onClick={() => setActiveRightPanel(null)}
                                                className="p-1.5 hover:bg-gray-100/50 dark:hover:bg-slate-800/50 rounded-lg text-gray-400 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>

                                        {/* Panel Content */}
                                        <div className="flex-1 overflow-y-auto scrollbar-hide">
                                            {/* === ROUTE DETAILS === */}
                                            {activeRightPanel === 'route' && (
                                                routeDetails.length > 0 ? (
                                                    <div className="space-y-6 relative">
                                                        <div className="absolute left-[11px] top-[10px] bottom-[10px] w-0 border-l-2 border-dashed border-gray-300/70"></div>
                                                        {routeDetails.map((stop: any) => (
                                                            <div key={stop.id} className="flex gap-4 relative">
                                                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black text-white z-10 shadow-sm">
                                                                    {stop.id}
                                                                </div>
                                                                <div className="pt-0.5 flex-1">
                                                                    <div className="flex items-center justify-between mb-0.5">
                                                                        <div className="text-xs font-bold text-gray-900 dark:text-slate-100">{stop.location}</div>
                                                                        <div className="text-[9px] font-black text-blue-600 bg-blue-50/80 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">{stop.timing}</div>
                                                                    </div>
                                                                    <div className="text-[10px] font-medium text-gray-500 dark:text-slate-400 uppercase line-clamp-1">{stop.address}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                                        <div className="w-12 h-12 bg-white/50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-3 text-gray-400 dark:text-slate-600">
                                                            <MapPin size={24} />
                                                        </div>
                                                        <p className="text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-1">No route generated</p>
                                                        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">Add stops to your shipment <br /> to see the journey details.</p>
                                                    </div>
                                                )
                                            )}

                                            {/* === HISTORY STATUS === */}
                                            {activeRightPanel === 'history' && (
                                                historyStatus.length > 0 ? (
                                                    <div className="space-y-6 relative">
                                                        <div className="absolute left-[11px] top-[10px] bottom-[10px] w-0 border-l-2 border-gray-300/50"></div>
                                                        {historyStatus.map((item, idx) => (
                                                            <div key={idx} className="flex gap-4 relative">
                                                                <div className={`flex-shrink-0 w-6 h-6 rounded-lg ${item.bgColor} flex items-center justify-center z-10 shadow-sm`}>
                                                                    <item.icon size={12} className={item.iconColor} />
                                                                </div>
                                                                <div className="pt-0.5 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                        <span className="text-xs font-black text-gray-900 dark:text-slate-100">{item.status}</span>
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
                                                        <div className="w-12 h-12 bg-white/50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-3 text-gray-400 dark:text-slate-600">
                                                            <Clock size={24} />
                                                        </div>
                                                        <p className="text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-1">History pending</p>
                                                        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">Submit the order to <br /> start tracking the status.</p>
                                                    </div>
                                                )
                                            )}

                                            {/* === OPERATION DETAILS === */}
                                            {activeRightPanel === 'operation' && (
                                                <div className="flex flex-col">
                                                    {/* Truck Image */}
                                                    <div className="flex justify-center mb-4 relative">
                                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-28 bg-blue-100 rounded-full blur-[60px] opacity-20"></div>
                                                        <img
                                                            src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=800"
                                                            alt="Delivery Truck"
                                                            className="w-48 h-32 object-contain relative z-10 drop-shadow-2xl brightness-105"
                                                        />
                                                    </div>

                                                    <div className="text-center mb-4">
                                                        <h4 className="text-base font-black text-gray-900 dark:text-slate-100 mb-1">{assignedVehicle ? `${assignedVehicle.brand} ${assignedVehicle.model}` : 'Volvo FMX 460'} - <span className="text-blue-600">#{assignedVehicle?.plate || 'XL-43543'}</span></h4>
                                                        <div className="flex items-center justify-center gap-2">
                                                            <span className="px-2 py-0.5 bg-gray-100/80 rounded-md text-[9px] font-black text-gray-500 uppercase tracking-tighter">Container ID</span>
                                                            <span className="text-[10px] font-mono font-bold text-gray-400">#JAKQHH671</span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3 mb-4">
                                                        <div className="bg-white/20 dark:bg-slate-800/40 rounded-2xl p-3 border border-white/10 dark:border-slate-700/40 flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-orange-50/80 dark:bg-orange-500/10 flex items-center justify-center text-orange-500">
                                                                <LayoutGrid size={16} />
                                                            </div>
                                                            <div>
                                                                <div className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Container Type</div>
                                                                <div className="text-sm font-bold text-gray-900 dark:text-slate-100">FLC 20 Standart</div>
                                                            </div>
                                                        </div>
                                                        <div className="bg-white/60 dark:bg-slate-800/60 rounded-2xl p-3 border border-white/40 dark:border-slate-700/40 flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-emerald-50/80 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                                <CheckCircle2 size={16} />
                                                            </div>
                                                            <div>
                                                                <div className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Available Load</div>
                                                                <div className="text-sm font-bold text-gray-900 dark:text-slate-100">{assignedVehicle ? `0kg / ${(assignedVehicle.specs?.maxWeight || 0).toLocaleString()}kg` : '0kg / 0kg'}</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Driver Card */}
                                                    <div className="bg-white/20 dark:bg-slate-800/40 border border-white/10 dark:border-slate-700/40 rounded-[20px] p-3 flex items-center justify-between shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative">
                                                                <img src={`https://i.pravatar.cc/150?u=${assignedDriver?.driverId || 'none'}`} alt="Driver" className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" />
                                                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center border border-gray-50 dark:border-slate-800 shadow-sm">
                                                                    <div className={`w-2 h-2 ${assignedDriver ? 'bg-emerald-500' : 'bg-gray-300'} rounded-full`}></div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-black text-gray-900 dark:text-slate-100">{assignedDriver?.driver.fullName || 'No driver auto-selected'}</div>
                                                                <div className="text-[10px] font-bold text-gray-400 dark:text-slate-500">{assignedDriver ? 'Senior Driver' : 'Status unknown'} • <span className={`${assignedDriver ? 'text-emerald-500' : 'text-gray-400'} uppercase tracking-tighter`}>{assignedDriver ? 'Available' : 'Unavailable'}</span></div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button className="p-2 text-gray-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50/80 dark:hover:bg-blue-900/20 bg-white/20 dark:bg-slate-900/40 border border-white/10 dark:border-slate-700/40 rounded-full transition-all shadow-sm"><Phone size={14} /></button>
                                                            <button className="p-2 text-gray-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50/80 dark:hover:bg-blue-900/20 bg-white/20 dark:bg-slate-900/40 border border-white/10 dark:border-slate-700/40 rounded-full transition-all shadow-sm"><MessageSquare size={14} /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* === WEIGHT DISTRIBUTION === */}
                                            {activeRightPanel === 'weight' && (
                                                <div className="flex flex-col">
                                                    <div className="mb-6 px-2 relative">
                                                        <div className="flex items-baseline gap-2 mb-8">
                                                            <span className="text-3xl font-black text-gray-900 dark:text-slate-100 tracking-tighter">0%</span>
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase">of Total Capacity</span>
                                                        </div>

                                                        {/* Capacity Gauge */}
                                                        <div className="relative mb-6 h-8 flex items-center">
                                                            <div className="h-[2px] w-full bg-gray-200/50 rounded-full relative">
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
                                                                        className="w-[2px] rounded-full bg-gray-300"
                                                                        style={{ height: `${h}%` }}
                                                                    ></div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 space-y-0.5">
                                                        <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200/30 pb-2 px-2 mb-2">
                                                            <span>Load Type</span>
                                                            <span>Weight (g)</span>
                                                        </div>

                                                        <div className="text-center py-6 border-2 border-dashed border-gray-200/40 rounded-3xl text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                                            No items in load
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {/* === TRANSIT ITEMS === */}
                                            {activeRightPanel === 'items' && (
                                                <div className="flex flex-col h-full">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">
                                                            {order?.transitItems?.length || 0} ITEMS EN TRANSIT
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-hide pb-10">
                                                        {order?.transitItems && order.transitItems.length > 0 ? (
                                                            order.transitItems.map((item: any) => (
                                                                <div
                                                                    key={item.id}
                                                                    className="group bg-white/20 dark:bg-slate-800/40 rounded-[20px] p-3 border border-white/10 dark:border-slate-700/40 hover:border-blue-300 dark:hover:border-blue-500/50 transition-all cursor-pointer shadow-sm hover:shadow-md"
                                                                    onClick={() => {
                                                                        // Find which stop has this item
                                                                        const stopWithItem = steps.flatMap(s => s.stops).find(st =>
                                                                            st.actions?.some((a: any) => a.transitItemId === item.id)
                                                                        );
                                                                        if (stopWithItem) {
                                                                            const stepIdx = steps.findIndex(s => s.stops.some(st => st.id === stopWithItem.id));
                                                                            const stopIdx = steps[stepIdx].stops.findIndex(st => st.id === stopWithItem.id);
                                                                            handleOpenStopDetail(stepIdx, stopIdx);
                                                                        }
                                                                    }}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                                                            <Package size={18} />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex justify-between items-start mb-0.5">
                                                                                <h4 className="text-[11px] font-black text-gray-900 dark:text-slate-100 uppercase tracking-tight truncate">
                                                                                    {item.name}
                                                                                </h4>
                                                                                <span className="text-[10px] font-mono font-bold text-gray-400">
                                                                                    {item.weight > 0 ? `${(item.weight / 1000).toFixed(1)}kg` : ''}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter
                                                                                    ${item.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600' :
                                                                                        item.status === 'IN_TRANSIT' ? 'bg-blue-50 text-blue-600' :
                                                                                            'bg-gray-100 text-gray-500'}`}>
                                                                                    {item.status || 'DRAFT'}
                                                                                </span>
                                                                                <span className="text-[9px] text-gray-400 font-medium truncate">
                                                                                    {item.packaging_type} • ID: {item.id.slice(-6)}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
                                                                <Package size={40} className="text-gray-300 mb-3" />
                                                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Aucun item</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Icon Bar (always visible) */}
                        <div className="flex flex-col items-center gap-2 py-3 px-1.5 bg-white/20 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[20px] border border-white/20 dark:border-slate-600/50 shadow-2xl shadow-black/15 self-start">
                            {([
                                { id: 'route' as const, icon: MapPin, label: 'Route', activeClass: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 shadow-lg shadow-blue-200/50 dark:shadow-blue-500/10 scale-105', dotClass: 'bg-blue-500' },
                                { id: 'history' as const, icon: Clock, label: 'Historique', activeClass: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 shadow-lg shadow-amber-200/50 dark:shadow-amber-500/10 scale-105', dotClass: 'bg-amber-500' },
                                { id: 'operation' as const, icon: Truck, label: 'Opération', activeClass: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 shadow-lg shadow-indigo-200/50 dark:shadow-indigo-500/10 scale-105', dotClass: 'bg-indigo-500' },
                                { id: 'weight' as const, icon: LayoutGrid, label: 'Charge', activeClass: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 shadow-lg shadow-emerald-200/50 dark:shadow-emerald-500/10 scale-105', dotClass: 'bg-emerald-500' },
                                { id: 'items' as const, icon: Package, label: 'Items', activeClass: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 shadow-lg shadow-rose-200/50 dark:shadow-rose-500/10 scale-105', dotClass: 'bg-rose-500' },
                            ]).map(({ id, icon: Icon, label, activeClass, dotClass }) => (
                                <button
                                    key={id}
                                    onClick={() => handleRightPanelToggle(id)}
                                    className={`relative p-3 rounded-2xl transition-all duration-200 group ${activeRightPanel === id
                                        ? activeClass
                                        : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100/60 dark:hover:bg-slate-800/60'
                                        }`}
                                    title={label}
                                >
                                    <Icon size={20} />
                                    {/* Active indicator dot */}
                                    {activeRightPanel === id && (
                                        <motion.div
                                            layoutId="activeIndicator"
                                            className={`absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-4 ${dotClass} rounded-full`}
                                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                        />
                                    )}
                                </button>
                            ))}
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
        </div >
    );
}
