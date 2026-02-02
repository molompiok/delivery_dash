import React, { useState, useEffect, useRef } from 'react';
import { usePageContext } from 'vike-react/usePageContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    Plus,
    Maximize2,
    Minimize2,
    Navigation,
    MoreVertical,
    Truck,
    Clock,
    CheckCircle2,
    Phone,
    MessageSquare,
    Zap,
    X,
    User,
    MapPin,
    AlertTriangle,
    Loader2,
    RotateCcw,
    Send,
    Check
} from 'lucide-react';
import { arrayMove } from '@dnd-kit/sortable';
import ListOptions from '../../../components/orders/ListOptions';
import StopListWrapper from '../../../components/orders/StopListWrapper';
import { GoogleMap, Marker, Polyline } from '../../../components/GoogleMap';
import { useHeader } from '../../../context/HeaderContext';
import { ConfirmModal } from '../../../components/ConfirmModal';
import StopDetailPanel from '../../../components/orders/StopDetailPanel';
import { ordersApi, Order, Step as ApiStep } from '../../../api/orders';
import { driverService } from '../../../api/drivers';
import { fleetService } from '../../../api/fleet';
import { User as UserType, CompanyDriverSetting, Vehicle } from '../../../api/types';

interface Stop {
    id: string;
    type: string;
    typeColor: string;
    isPendingChange?: boolean;
    isDeleteRequired?: boolean;
    originalId?: string;
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
}

interface PageStep {
    id: string;
    name: string;
    stops: Stop[];
    searchQuery: string;
    isSearchExpanded: boolean;
    isLinked: boolean;
    isPendingChange?: boolean;
    originalId?: string;
}

export default function Page() {
    const pageContext = usePageContext();
    const { id } = pageContext.routeParams;

    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [steps, setSteps] = useState<PageStep[]>([]);
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

    useEffect(() => {
        if (id) {
            fetchOrder();
        }
    }, [id]);

    const fetchOrder = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            const data = await ordersApi.get(id);
            setOrder(data);
            setSteps(mapServerToLocalSteps(data.steps));
        } catch (error) {
            console.error("Failed to fetch order", error);
            showAlert("Error", "Failed to load order details.");
        } finally {
            setIsLoading(false);
        }
    };

    const mapServerToLocalSteps = (serverSteps: ApiStep[]): PageStep[] => {
        return serverSteps.map((s, idx) => ({
            id: s.id,
            name: `Step ${idx + 1}`,
            isLinked: s.linked,
            isPendingChange: s.isPendingChange,
            originalId: s.originalId,
            searchQuery: '',
            isSearchExpanded: false,
            stops: s.stops.map(st => ({
                id: st.id,
                isPendingChange: st.isPendingChange,
                isDeleteRequired: st.isDeleteRequired,
                originalId: st.originalId,
                type: st.actions.length > 0 ? (st.actions[0].type === 'PICKUP' ? 'Collecte' : st.actions[0].type === 'DELIVERY' ? 'Livraison' : 'Service') : 'À définir',
                typeColor: st.actions.length > 0 ? (st.actions[0].type === 'PICKUP' ? 'bg-orange-50 text-orange-600' : st.actions[0].type === 'DELIVERY' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600') : 'bg-gray-50 text-gray-600',
                address: {
                    id: st.address.id || '',
                    addressId: st.addressId,
                    name: st.address.label || '',
                    street: st.address.formattedAddress || '',
                    city: '',
                    country: '',
                    lat: st.address.lat,
                    lng: st.address.lng
                },
                opening: {
                    start: st.arrivalWindowStart || '08:00 AM',
                    end: st.arrivalWindowEnd || '06:00 PM'
                },
                actions: st.actions.map(a => ({
                    id: a.id,
                    type: a.type.toLowerCase(),
                    productName: a.metadata?.productName || (a.type === 'SERVICE' ? 'Service' : 'Produit'),
                    productDescription: a.metadata?.productDescription || '',
                    unitaryPrice: a.metadata?.unitaryPrice || 0,
                    quantity: a.quantity,
                    service_time: a.serviceTime / 60,
                    status: a.status,
                    isPendingChange: a.isPendingChange,
                    isDeleteRequired: a.isDeleteRequired,
                    originalId: a.originalId,
                    requirements: a.metadata?.requirements || []
                })),
                client: st.metadata?.client || { name: '', avatar: '', phone: '' }
            }))
        }));
    };

    const handleOpenStopDetail = (stepIdx: number, stopIdx: number, stopOverride?: any) => {
        const stop = stopOverride || steps[stepIdx].stops[stopIdx];
        if (!stop) return;

        setSelectedStop(stop);
        setSelectedStopMeta({ stepIdx, stopIdx });
        setIsStopDetailOpen(true);
    };

    const handleUpdateStop = async (updatedStop: any) => {
        if (!id) return;
        try {
            // Map actions back to server expected structure
            const apiActions = updatedStop.actions.map((a: any) => ({
                id: a.id,
                type: a.type.toUpperCase(),
                quantity: a.quantity,
                serviceTime: a.service_time * 60,
                metadata: {
                    productName: a.productName,
                    productDescription: a.productDescription,
                    unitaryPrice: a.unitaryPrice,
                    requirements: a.requirements
                }
            }));

            const payload: any = {
                metadata: {
                    client: updatedStop.client
                },
                actions: apiActions
            };

            // If coordinates/address changed, we would update address too. 
            // For now assuming StopDetailPanel only updates actions and client metadata.

            await ordersApi.updateStop(updatedStop.id, payload, { recalculate: true });
            fetchOrder(false); // Silent refresh
        } catch (error: any) {
            console.error("Update failed", error);
            showAlert("Erreur", error.message || "Impossible de mettre à jour l'arrêt.");
            fetchOrder(); // Revert
        }
    };

    const handleRestoreStop = async () => {
        if (!selectedStop || !id) return;
        try {
            // Restore means removing the pending change or actual delete if in DRAFT
            await ordersApi.removeStop(selectedStop.id, { recalculate: true });
            setIsStopDetailOpen(false);
            fetchOrder();
        } catch (error: any) {
            console.error("Restore failed", error);
            showAlert("Erreur", error.message || "Impossible de restaurer l'arrêt.");
        }
    };

    const handleAddStep = async () => {
        try {
            await ordersApi.addStep(id, { name: `Étape ${steps.length + 1}` });
            fetchOrder();
            setActiveStep(steps.length);
            setDirection(1);
        } catch (error: any) {
            showAlert("Erreur", error.message || "Impossible d'ajouter une étape.");
        }
    };

    const handleAddStop = async (stepIdx: number) => {
        try {
            const stepId = steps[stepIdx].id;
            const newStop = await ordersApi.addStop(stepId, {
                address_text: "À définir",
                actions: [
                    { type: 'SERVICE', quantity: 0, serviceTime: 600, metadata: { productName: 'Service' } }
                ]
            }, { recalculate: true });

            await fetchOrder();

            // Auto open the new stop for editing
            // We need to find the local index of this new stop
            const data = await ordersApi.get(id);
            const serverStep = data.steps.find(s => s.id === stepId);
            if (serverStep) {
                const stopIdx = serverStep.stops.length - 1;
                handleOpenStopDetail(stepIdx, stopIdx);
            }
        } catch (error: any) {
            showAlert("Erreur", error.message || "Impossible d'ajouter un arrêt.");
        }
    };

    const handleDeleteStep = async (stepIdx: number) => {
        try {
            const stepId = steps[stepIdx].id;
            await ordersApi.removeStep(stepId, { recalculate: true });
            fetchOrder();
            if (activeStep >= steps.length - 1) {
                setActiveStep(Math.max(0, steps.length - 2));
            }
        } catch (error: any) {
            showAlert("Erreur", error.message || "Impossible de supprimer l'étape.");
        }
    };

    const handlePush = async () => {
        if (!id) return;
        try {
            await ordersApi.pushUpdates(id);
            showAlert("Succès", "Les modifications ont été poussées au chauffeur.");
            fetchOrder();
        } catch (error: any) {
            showAlert("Erreur", error.message || "Impossible de pousser les mises à jour.");
        }
    };

    const handleSubmitOrder = async () => {
        if (!id) return;
        try {
            await ordersApi.submit(id);
            showAlert("Succès", "La commande a été finalisée et passée en attente.");
            fetchOrder();
        } catch (error: any) {
            showAlert("Erreur", error.message || "Impossible de finaliser la commande.");
        }
    };

    // Header Sync
    useEffect(() => {
        const hasModifications = steps.some(s =>
            s.isPendingChange ||
            s.stops.some(st =>
                st.isPendingChange ||
                st.isDeleteRequired ||
                st.actions.some(a => a.isPendingChange || a.isDeleteRequired)
            )
        );

        const isDraft = order?.status === 'DRAFT';

        setHeaderContent(
            <div className="flex items-center justify-between w-full h-full">
                <div className="flex items-center gap-4">
                    <button onClick={() => window.location.href = '/orders'} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ChevronLeft size={24} className="text-gray-600" />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black text-gray-900 tracking-tight">Mission {order?.id.replace('ord_', '#')}</h1>
                        <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${isDraft ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                {order?.status}
                            </span>
                            {hasModifications && !isDraft && (
                                <span className="text-[9px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-1">
                                    <Zap size={10} fill="currentColor" /> Modifications en attente
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchOrder()}
                        className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Rafraîchir"
                    >
                        <RotateCcw size={20} />
                    </button>

                    {isDraft ? (
                        <button
                            onClick={handleSubmitOrder}
                            className="px-6 py-2 text-[11px] font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl uppercase tracking-widest shadow-lg shadow-emerald-100 transition-all flex items-center gap-2"
                        >
                            <Check size={14} />
                            Finaliser la commande
                        </button>
                    ) : (
                        <button
                            onClick={handlePush}
                            disabled={!hasModifications}
                            className={`px-6 py-2 text-[11px] font-black rounded-xl uppercase tracking-widest shadow-lg transition-all flex items-center gap-2 ${hasModifications
                                ? 'text-white bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                                : 'text-gray-400 bg-gray-100 shadow-none cursor-not-allowed'
                                }`}
                        >
                            <Send size={14} />
                            Pousser les mises à jour
                        </button>
                    )}
                </div>
            </div>
        );
        return () => clearHeaderContent();
    }, [order, steps]);

    // Map & Route Helpers
    const mapPath = order?.routeGeometry ? order.routeGeometry.coordinates.map(c => ({ lat: c[1], lng: c[0] })) : [];
    const routeDetails = order?.legs ? order.legs.map((l, i) => ({
        id: (i + 1).toString(),
        location: `Stop ${i + 1}`,
        address: steps.flatMap(s => s.stops).find(st => st.originalId === l.steps?.[0]?.originalId || st.id === l.steps?.[0]?.id)?.address.street || 'En route...',
        duration: l.duration,
        distance: l.distance
    })) : [];

    // Alert Modal State
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', description: '' });
    const showAlert = (title: string, description: string) => setAlertConfig({ isOpen: true, title, description });

    if (isLoading && !order) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-blue-600" size={48} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chargement de la mission...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#f4f7fa] overflow-hidden font-sans">
            <main className="flex flex-1 overflow-hidden">
                {/* Left Sidebar: Stop List */}
                <aside className={`flex flex-col bg-[#f4f7fa] border-r border-gray-100 px-4 pt-4 pb-2 h-full overflow-hidden transition-all duration-500 ease-in-out relative ${isSidebarFullscreen ? 'w-full' : 'w-[420px]'}`}>

                    {/* Fullscreen Actions */}
                    {isSidebarFullscreen && (
                        <div className="absolute top-4 right-6 z-50 flex items-center gap-2 bg-white/60 backdrop-blur-xl p-1.5 rounded-[20px] border border-white/40 shadow-xl">
                            <button
                                onClick={handleAddStep}
                                className="p-2.5 bg-white text-blue-600 rounded-xl border border-gray-100 hover:bg-blue-50 transition-all flex items-center gap-2 group"
                            >
                                <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-widest pr-1">Ajouter Étape</span>
                            </button>
                            <button
                                onClick={() => setIsSidebarFullscreen(false)}
                                className="p-2.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl transition-all shadow-sm hover:bg-blue-100"
                            >
                                <Minimize2 size={18} />
                            </button>
                        </div>
                    )}

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
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeStep === idx
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                            : 'bg-white/80 text-gray-400 border border-gray-100 hover:border-blue-200 hover:text-blue-600'}`}
                                    >
                                        <span>{step.name}</span>
                                        {step.isPendingChange && <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />}
                                        {activeStep === idx && steps.length > 1 && (
                                            <X size={12} className="hover:text-rose-200" onClick={(e) => { e.stopPropagation(); handleDeleteStep(idx); }} />
                                        )}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200/50">
                                <button
                                    onClick={handleAddStep}
                                    className="p-2 bg-white text-blue-600 rounded-xl border border-gray-200 hover:bg-blue-50 transition-all shadow-sm"
                                    title="Ajouter Étape"
                                >
                                    <Plus size={16} />
                                </button>
                                <button
                                    onClick={() => setIsSidebarFullscreen(true)}
                                    className="p-2 bg-white text-gray-400 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto scrollbar-hide px-1">
                        <div className="mb-4">
                            <ListOptions
                                step={steps[activeStep] || {}}
                                stepIdx={activeStep}
                                stopCount={steps[activeStep]?.stops.length || 0}
                                totalSteps={steps.length}
                                onSearch={() => { }}
                                onAdd={() => handleAddStop(activeStep)}
                                onToggleSearch={() => { }}
                                onToggleLink={() => { }}
                                onDelete={() => handleDeleteStep(activeStep)}
                            />
                        </div>

                        <StopListWrapper
                            stops={steps[activeStep]?.stops || []}
                            isLinked={steps[activeStep]?.isLinked}
                            onReorder={() => { }}
                            onMoveItem={() => { }}
                            onOpenDetail={(stop) => {
                                const stopIdx = steps[activeStep].stops.findIndex(s => s.id === stop.id);
                                handleOpenStopDetail(activeStep, stopIdx);
                            }}
                        >
                            {steps[activeStep]?.stops.length === 0 && (
                                <div
                                    onClick={() => handleAddStop(activeStep)}
                                    className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-[28px] text-gray-400 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
                                >
                                    <Plus size={24} className="text-gray-300 group-hover:text-blue-400 mb-2" />
                                    <div className="text-[10px] font-black uppercase tracking-widest">Ajouter un arrêt</div>
                                </div>
                            )}
                        </StopListWrapper>
                    </div>
                </aside>

                {/* Main Content Area */}
                <section className={`flex-1 overflow-y-auto scrollbar-hide p-6 transition-all duration-500 ${isSidebarFullscreen ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
                    <div className="flex gap-6 h-full">
                        <div className="flex-1 flex flex-col gap-6">
                            <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Aperçu Carte & Trajet</h2>
                            <div className="flex-1 rounded-[32px] overflow-hidden border border-white shadow-xl relative min-h-[400px] bg-slate-50">
                                <GoogleMap
                                    center={mapPath[0] || { lat: 5.348, lng: -4.03 }}
                                    zoom={12}
                                    className="w-full h-full"
                                >
                                    {mapPath.length > 0 && <Polyline path={mapPath} strokeColor="#2563eb" strokeWeight={5} strokeOpacity={0.8} />}
                                    {steps.flatMap(s => s.stops).map((st, i) => (
                                        st.address.lat && st.address.lng && (
                                            <Marker
                                                key={st.id}
                                                position={{ lat: st.address.lat, lng: st.address.lng }}
                                                label={{ text: (i + 1).toString(), color: 'white', fontWeight: '900' }}
                                            />
                                        )
                                    ))}
                                </GoogleMap>
                            </div>
                        </div>

                        {/* Route Details Panel */}
                        <div className="w-[380px] flex flex-col gap-6">
                            <div className="flex items-center gap-4 border-b border-gray-100 pb-2">
                                <button
                                    onClick={() => setActiveRouteTab('details')}
                                    className={`text-[11px] font-black uppercase tracking-widest pb-1 transition-all ${activeRouteTab === 'details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}
                                >
                                    Détails Routage
                                </button>
                                <button
                                    onClick={() => setActiveRouteTab('history')}
                                    className={`text-[11px] font-black uppercase tracking-widest pb-1 transition-all ${activeRouteTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}
                                >
                                    Timeline
                                </button>
                            </div>

                            <div className="flex-1 bg-white rounded-[32px] p-6 border border-gray-50 shadow-sm overflow-y-auto scrollbar-hide">
                                {activeRouteTab === 'details' ? (
                                    routeDetails.length > 0 ? (
                                        <div className="space-y-6 relative">
                                            <div className="absolute left-[11px] top-4 bottom-4 w-0.5 border-l-2 border-dashed border-gray-100" />
                                            {routeDetails.map((stop) => (
                                                <div key={stop.id} className="flex gap-4 relative group">
                                                    <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-[10px] font-black text-white z-10 shadow-lg">
                                                        {stop.id}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight truncate">{stop.address}</div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase">{(stop.distance / 1000).toFixed(1)} km</span>
                                                            <span className="w-1 h-1 rounded-full bg-gray-200" />
                                                            <span className="text-[10px] font-black text-gray-400 uppercase">{Math.round(stop.duration / 60)} min</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-gray-300">
                                                <MapPin size={24} />
                                            </div>
                                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Pas de trajet</p>
                                        </div>
                                    )
                                ) : (
                                    <div className="text-center py-12 text-gray-400 uppercase tracking-widest text-[10px] font-black italic">Timeline en attente...</div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <StopDetailPanel
                isOpen={isStopDetailOpen}
                onClose={() => setIsStopDetailOpen(false)}
                stop={selectedStop}
                order={order}
                pathPrefix={`steps[${activeStep}].stops[${selectedStopMeta?.stopIdx}]`}
                onUpdate={handleUpdateStop}
                onRestore={handleRestoreStop}
                onDelete={() => { }}
            />

            <ConfirmModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                description={alertConfig.description}
                confirmLabel="OK"
                showCancel={false}
            />
        </div>
    );
}
