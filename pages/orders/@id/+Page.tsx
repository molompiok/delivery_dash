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
    Check
} from 'lucide-react';
import { arrayMove } from '@dnd-kit/sortable';
import ListOptions from './components/ListOptions';
import StopListWrapper from './components/StopListWrapper';
import { GoogleMap, Marker, Polyline } from '../../../components/GoogleMap';
import { useHeader } from '../../../context/HeaderContext';
import { ConfirmModal } from '../../../components/ConfirmModal';
import StopDetailPanel from './components/StopDetailPanel';
import { ordersApi, Order, Step as ApiStep, ValidationIssue } from '../../../api/orders';
import { driverService } from '../../../api/drivers';
import { fleetService } from '../../../api/fleet';
import { User as UserType, CompanyDriverSetting, Vehicle } from '../../../api/types';

interface Stop {
    id: string;
    type: string;
    typeColor: string;
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
    const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);

    const [activeStep, setActiveStep] = useState(0);
    const [direction, setDirection] = useState(0);
    const [isSidebarFullscreen, setIsSidebarFullscreen] = useState(false);
    const [activeRouteTab, setActiveRouteTab] = useState<'details' | 'history'>('details');
    const { setHeaderContent, clearHeaderContent } = useHeader();
    const listRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
    const kanbanRef = useRef<HTMLDivElement | null>(null);

    // Stop Detail Panel State
    const [selectedStop, setSelectedStop] = useState<any>(null);
    const [isStopDetailOpen, setIsStopDetailOpen] = useState(false);
    const [selectedStopMeta, setSelectedStopMeta] = useState<{ stepIdx: number; stopIdx: number } | null>(null);

    // --- LOCALSTORAGE DRAFT SYSTEM (Single key per order) ---
    // Structure: { stops: { [stopId]: stopData }, lastModified: ISO }
    const ORDER_DRAFT_KEY = `order_draft_${id}`;

    interface OrderDraft {
        steps: any[];
        stops: { [stopId: string]: any }; // Legacy
        lastModified: string;
    }

    const getOrderDraft = (): OrderDraft | null => {
        if (typeof window === 'undefined') return null;
        try {
            const raw = localStorage.getItem(ORDER_DRAFT_KEY);
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (e) {
            console.error("Failed to parse order draft", e);
        }
        return null;
    };

    const saveOrderDraft = (stepsData: any[]) => {
        if (typeof window === 'undefined') return;
        try {
            const draft: OrderDraft = {
                stops: {}, // Legacy support if needed, but we now save full steps
                steps: stepsData,
                lastModified: new Date().toISOString()
            };
            localStorage.setItem(ORDER_DRAFT_KEY, JSON.stringify(draft));
        } catch (e) {
            console.error("Failed to save order draft", e);
        }
    };

    // Debounced Auto-Save
    useEffect(() => {
        if (steps.length === 0) return;

        const hasModifications = steps.some(step =>
            step.stops.some((stop: any) => stop.isModified || stop.isNew)
        );

        if (hasModifications) {
            const timer = setTimeout(() => {
                saveOrderDraft(steps);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [steps]);


    const clearAllDrafts = () => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(ORDER_DRAFT_KEY);
    };

    const handleOpenStopDetail = (stepIdx: number, stopIdx: number, stopOverride?: any) => {
        const stop = stopOverride || steps[stepIdx].stops[stopIdx];
        if (!stop) return;

        setSelectedStop(stop);
        setSelectedStopMeta({ stepIdx, stopIdx });
        setIsStopDetailOpen(true);
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

    const mapServerToLocalSteps = (serverSteps: ApiStep[]): PageStep[] => {
        if (!serverSteps || serverSteps.length === 0) {
            return [{ id: undefined, name: 'Step 1', stops: [], searchQuery: '', isSearchExpanded: false, isLinked: false, isNew: true }];
        }

        return serverSteps.map((s, idx) => ({
            id: s.id,
            name: `Step ${idx + 1}`,
            isLinked: s.linked ?? false,
            searchQuery: '',
            isSearchExpanded: false,
            stops: (s.stops || []).map(st => {
                const addressExtra = st.metadata?.address_extra || {};
                const clientData = st.metadata?.client || {};
                const openingHours = clientData.opening_hours || {};

                return {
                    id: st.id,
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
                        call: addressExtra.call || '',
                        room: addressExtra.room || '',
                        stage: addressExtra.stage || ''
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
                        weight_g: a.transitItem?.weight_g || a.metadata?.weight_g || a.metadata?.weight, // unified in grams
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
                        opening: openingHours
                    },
                    metadata: st.metadata
                };
            })
        }));
    };

    const fetchOrder = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            const response = await ordersApi.get(id);
            const serverOrder = response.entity || (response as any).order || response;

            // Fix: serverOrder.steps is the array we need to map
            const serverSteps = Array.isArray(serverOrder.steps) ? serverOrder.steps : [];
            const mappedSteps = mapServerToLocalSteps(serverSteps);

            // Check for Local Draft Recovery
            const draft = getOrderDraft();
            if (draft && draft.steps && draft.lastModified) {
                const serverUpdatedAt = serverOrder.updated_at || serverOrder.updatedAt;
                const isDraftNewer = !serverUpdatedAt || new Date(draft.lastModified) > new Date(serverUpdatedAt);

                if (isDraftNewer) {
                    setAlertConfig({
                        isOpen: true,
                        title: "Récupération",
                        description: "Vous avez des modifications non enregistrées pour cette commande. Voulez-vous les restaurer ?",
                        onConfirm: () => {
                            setSteps(draft.steps);
                            setAlertConfig(prev => ({ ...prev, isOpen: false }));
                        },
                        onClose: () => {
                            setSteps(mappedSteps);
                            clearAllDrafts(); // Discard if user says no
                        }
                    });
                } else {
                    setSteps(mappedSteps);
                }
            } else {
                setSteps(mappedSteps);
            }

            setOrder(serverOrder);
        } catch (error) {
            console.error("Failed to fetch order", error);
            showAlert("Erreur", "Impossible de charger les détails de la commande.");
        } finally {
            if (showLoading) setIsLoading(false);
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
                        weight_g: (action.weight || 0) * 1000,
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
            const result = await ordersApi.pushUpdates(id);
            setOrder(result.order);
            showAlert("Mise à jour envoyée", `Les modifications ont été envoyées au chauffeur.`);
        } catch (error: any) {
            console.error("Push updates failed", error);
            showAlert("Échec de l'envoi", error.response?.data?.message || error.message || "Une erreur s'est produite.");
            await fetchOrder(false);
        }
    };

    // Save stop to server (called when closing panel or pressing Done)
    const handleSaveStop = async () => {
        if (!selectedStopMeta || !selectedStop) return;
        const { stepIdx, stopIdx } = selectedStopMeta;
        const step = steps[stepIdx];
        if (!step) return;

        const stop = selectedStop;
        const stepId = step.id;

        // If step doesn't have an ID yet, we need to save the step first
        if (!stepId) {
            console.log("Step not saved yet, cannot save stop");
            return;
        }

        // Map local actions to API format (snake_case Pivot JSON)
        // Local Verification: Strict ID Consistency
        const actionsPayload = (stop.actions || []).map((action: any) => {
            const ti_id = action._transitItemId || action.transitItemId;
            if (ti_id && action.transitItemId && ti_id !== action.transitItemId) {
                console.error("Local Inconsistency detected: ", ti_id, action.transitItemId);
            }
            return {
                type: action.type?.toLowerCase() || 'service',
                quantity: action.quantity || 1,
                transit_item_id: action._transitItemId || action.transitItemId, // Priority if linking
                transit_item: action.type !== 'service' ? {
                    id: (action._transitItemId || action.transitItemId) || undefined, // Strict Match Ensure
                    name: action.productName || 'Product',
                    description: action.productDescription || '',
                    product_url: action.productUrl || undefined,
                    packaging_type: action.packagingType || 'box',
                    weight_g: action.weight_g || 0, // Explicit grams
                    unitary_price: action.unitaryPrice || 0,
                    dimensions: action.dimensions ? {
                        width_cm: action.dimensions.width,
                        height_cm: action.dimensions.height,
                        depth_cm: action.dimensions.depth,
                        volume_l: action.dimensions.volume
                    } : undefined,
                    requirements: action.requirements || []
                } : undefined,
                service_time: (action.service_time || 10) * 60, // Convert minutes to seconds
                confirmation_rules: {
                    photo: (action.confirmation?.photo || []).map((p: any) => ({
                        name: p.name || 'Photo',
                        pickup: p.pickup ?? true,
                        delivery: p.delivery ?? false,
                        compare: p.compare ?? false,
                        reference: p.reference || null
                    })),
                    code: (action.confirmation?.code || []).map((c: any) => ({
                        name: c.name || 'Code',
                        pickup: c.pickup ?? false,
                        delivery: c.delivery ?? true,
                        compare: c.compare ?? false,
                        reference: c.reference || null
                    }))
                },
                metadata: action.metadata || {}
            };
        });

        // Build Standard Pivot JSON Payload
        const stopPayload = {
            address: {
                address_id: stop.address?.addressId || undefined,
                street: stop.address?.street || '',
                city: stop.address?.city || '',
                country: stop.address?.country || '',
                lat: stop.address?.lat,
                lng: stop.address?.lng,
                call: stop.address?.call || '',
                room: stop.address?.room || '',
                stage: stop.address?.stage || ''
            },
            client: {
                client_id: stop.client?.clientId || undefined,
                name: stop.client?.name || '',
                phone: stop.client?.phone || '',
                email: stop.client?.email || '',
                avatar: stop.client?.avatar || '',
                opening_hours: {
                    duration: stop.client?.opening?.duration || 0,
                    start: stop.client?.opening?.start || null,
                    end: stop.client?.opening?.end || null
                }
            },
            sequence: stopIdx,
            actions: actionsPayload,
            metadata: {
                ...(stop.metadata || {}),
                type: stop.type || 'Service'
            }
        };

        console.log("Saving stop with payload:", JSON.stringify(stopPayload, null, 2));

        try {
            if (stop.isNew) {
                // Create new stop - stepId is first argument, payload is second
                const response = await ordersApi.addStop(stepId, stopPayload);
                const savedStop = response?.entity || response?.stop;

                if (!savedStop?.id) {
                    console.error("API didn't return a valid stop:", response);
                    showAlert("Erreur", "Le serveur n'a pas retourné un stop valide.");
                    return false;
                }

                // Update local state with server ID and clear draft
                setSteps(prev => prev.map((s, sIdx) =>
                    sIdx === stepIdx
                        ? {
                            ...s,
                            stops: s.stops.map((st, stIdx) =>
                                stIdx === stopIdx
                                    ? { ...st, id: savedStop.id, isNew: false, isModified: false }
                                    : st
                            )
                        }
                        : s
                ));
            } else if (stop.isModified && stop.id) {
                // Update existing stop  
                await ordersApi.updateStop(stop.id, stopPayload);

                // Clear modified flag and localStorage draft
                setSteps(prev => prev.map((s, sIdx) =>
                    sIdx === stepIdx
                        ? {
                            ...s,
                            stops: s.stops.map((st, stIdx) =>
                                stIdx === stopIdx ? { ...st, isModified: false } : st
                            )
                        }
                        : s
                ));
            }
            return true;
        } catch (error: any) {
            console.error("Failed to save stop", error);
            showAlert("Erreur", error.response?.data?.message || "Impossible de sauvegarder l'arrêt.");
            await fetchOrder(false);
            return false;
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
            const { step } = await ordersApi.addStep(id, {
                sequence: newStepIndex,
                linked: false
            });

            // Update step with server ID
            setSteps(prev => prev.map((s, idx) =>
                idx === newStepIndex
                    ? { ...s, id: step.id, isNew: false }
                    : s
            ));
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

    const handleAddStop = (stepIdx: number) => {
        const defaultType = { type: 'Service', color: 'bg-blue-50 text-blue-600' };

        const newStop: Stop = {
            id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            type: defaultType.type,
            typeColor: defaultType.color,
            address: {
                id: '',
                name: '',
                street: '',
                city: '',
                country: ''
            },
            opening: {
                start: '08:00',
                end: '18:00'
            },
            actions: [
                { id: `action_${Date.now()}`, productName: 'Service', quantity: 1, type: 'service', service_time: 10, requirements: [], status: 'Pending', secure: 'none' }
            ],
            client: { name: '', avatar: '', phone: '' },
            isNew: true // Flag for tracking unsaved stops
        };

        const nextStopIdx = steps[stepIdx].stops.length;

        setSteps(prev => prev.map((s, idx) =>
            idx === stepIdx
                ? {
                    ...s,
                    stops: [...s.stops, newStop]
                }
                : s
        ));

        // Auto-open stop detail
        handleOpenStopDetail(stepIdx, nextStopIdx, newStop);
        scrollToBottom(stepIdx);
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

    const handleToggleLink = (stepIdx: number) => {
        setSteps(prev => prev.map((s, idx) =>
            idx === stepIdx ? { ...s, isLinked: !s.isLinked } : s
        ));
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

    const handleReorderStop = (stepIdx: number, activeId: string, overId: string) => {
        setSteps(prev => prev.map((s, idx) => {
            if (idx !== stepIdx) return s;
            const oldIndex = s.stops.findIndex(c => c.id === activeId);
            const newIndex = s.stops.findIndex(c => c.id === overId);
            return {
                ...s,
                stops: arrayMove(s.stops, oldIndex, newIndex)
            };
        }));
    };

    const handleMoveItem = (stepIdx: number, itemIdx: number, direction: 'up' | 'down') => {
        setSteps(prev => prev.map((s, idx) => {
            if (idx !== stepIdx) return s;
            const newIndex = direction === 'up' ? itemIdx - 1 : itemIdx + 1;
            if (newIndex < 0 || newIndex >= s.stops.length) return s;
            return {
                ...s,
                stops: arrayMove(s.stops, itemIdx, newIndex)
            };
        }));
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
                    {isPending && (
                        <>
                            <button
                                onClick={() => fetchOrder(false)}
                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                                title="Actualiser"
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


    const routeDetails: any[] = [];

    const historyStatus: any[] = [];

    const mapPath: any[] = [];

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
                                    center={{ lat: 40.5, lng: -81.0 }}
                                    zoom={5}
                                    className="w-full h-full"
                                >
                                    {mapPath.map((pos, i) => (
                                        <Marker key={i} position={pos} label={(i + 1).toString()} />
                                    ))}
                                    <Polyline path={mapPath} strokeColor="#2563eb" strokeWeight={4} />
                                </GoogleMap>
                                {/* Map controls overlay */}
                                <div className="absolute right-4 top-4 flex flex-col gap-2">
                                    <button className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 text-gray-600">+</button>
                                    <button className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 text-gray-600">-</button>
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

                                            {routeDetails.map((stop) => (
                                                <div key={stop.id} className="flex gap-4 relative">
                                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black text-white z-10 shadow-sm">
                                                        {stop.id}
                                                    </div>
                                                    <div className="pt-0.5">
                                                        <div className="text-xs font-bold text-gray-900 mb-0.5">{stop.location}</div>
                                                        <div className="text-[10px] font-medium text-gray-400 uppercase">{stop.address}</div>
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
                                    <span>Weight</span>
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
                onClose={() => {
                    // Just close: data is preserved in 'steps' state and localStorage
                    setIsStopDetailOpen(false);
                }}
                onSave={async () => {
                    // Done: save changes to API
                    const success = await handleSaveStop();
                    if (success) {
                        setIsStopDetailOpen(false);
                    }
                }}
                stop={selectedStop}
                onUpdate={(newStop) => {
                    if (!selectedStopMeta) return;
                    const { stepIdx, stopIdx } = selectedStopMeta;
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
                }}
                onDelete={() => {
                    if (selectedStopMeta) {
                        handleDeleteStopInStep(selectedStopMeta.stepIdx, selectedStopMeta.stopIdx);
                    }
                }}
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
