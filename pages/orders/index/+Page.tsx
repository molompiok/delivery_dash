import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingBag,
    Search,
    Filter,
    RefreshCw,
    Plus,
    ChevronRight,
    Package,
    MapPin,
    Clock,
    Truck,
    ArrowUpRight,
    CheckCircle2,
    AlertCircle,
    Layers,
    X,
    ArrowDown,
    ArrowUp,
    Settings,
    MoreHorizontal,
    Star,
    Copy,
    Check,
    Bike,
    PackagePlus,
    PackageCheck,
    Hammer,
    Briefcase,
    Box,
    Bus,
    ArrowRight,
    ShieldCheck
} from 'lucide-react';
import { Order } from '../../../api/orders';

// Mocked Orders for the Premium Demo
import { ordersApi, OrderSummary } from '../../../api/orders';
import { socketClient } from '../../../api/socket';
import { formatId } from '../../../api/utils';
import { useHeaderAutoHide } from '../../../hooks/useHeaderAutoHide';

export default function Page() {
    useHeaderAutoHide();
    const [orders, setOrders] = useState<OrderSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchDebounced, setSearchDebounced] = useState('');
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [showFilters, setShowFilters] = useState(false);
    const [showNewOrderModal, setShowNewOrderModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [paginationMeta, setPaginationMeta] = useState({ total: 0, perPage: 12, currentPage: 1, lastPage: 1 });
    const [footerCounts, setFooterCounts] = useState<any>(null);
    const [orderStats, setOrderStats] = useState<any>(null);
    const ITEMS_PER_PAGE = 12;

    const handleNewOrder = () => {
        setShowNewOrderModal(true);
    };

    const handleCreateTemplate = async (template: string) => {
        try {
            const { order } = await ordersApi.initiate({ template });
            window.location.href = `/orders/${order.id}`;
        } catch (err) {
            console.error("Failed to initiate order:", err);
            setError("Erreur lors de la création.");
            setShowNewOrderModal(false);
        }
    };


    // Filter advanced states
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        minAmount: '',
        maxAmount: '',
        modes: ['GLOBAL', 'INTERNAL', 'TARGET'],
        type: 'ALL' // ALL, RECEIVED, EMITTED
    });

    const [error, setError] = useState<string | null>(null);
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchStats = async () => {
        try {
            const stats = await ordersApi.getStats({
                dailyCounts: true,
                completionRate: true,
                templates: true,
                inProgress: true
            });
            setOrderStats(stats);
        } catch (err) {
            console.error("Failed to fetch order stats:", err);
        }
    };

    const fetchOrders = async (silent = false, overrides: { page?: number, search?: string, status?: string } = {}) => {
        if (!silent) setIsLoading(true);
        setError(null);
        try {
            const [result] = await Promise.all([
                ordersApi.list({
                    view: 'summary',
                    page: overrides.page ?? currentPage,
                    perPage: ITEMS_PER_PAGE,
                    search: overrides.search ?? (searchDebounced || undefined),
                    status: (overrides.status ?? activeFilter) !== 'ALL' ? (overrides.status ?? activeFilter) : undefined,
                }),
                !silent ? fetchStats() : Promise.resolve()
            ]);
            const ordersData = Array.isArray(result) ? result : (result?.data || []);
            const metaData = Array.isArray(result) ? { total: result.length, perPage: 12, currentPage: 1, lastPage: 1 } : (result?.meta || { total: 0, perPage: 12, currentPage: 1, lastPage: 1 });

            setOrders(ordersData);
            setPaginationMeta(metaData);
            if (result?.meta?.counts) {
                setFooterCounts(result.meta.counts);
            }
        } catch (error: any) {
            console.error("Failed to fetch orders:", error);
            if (!silent) setError("Impossible de charger le flux de commandes. Veuillez vérifier votre connexion au serveur.");
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    // Debounced silent refresh for socket events
    const debouncedRefresh = () => {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = setTimeout(() => fetchOrders(true), 3000);
    };

    // Debounce search input (400ms)
    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            setSearchDebounced(searchTerm);
        }, 400);
        return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
    }, [searchTerm]);

    // Fetch when page, debounced search, or status filter changes
    useEffect(() => {
        fetchOrders(false, { page: currentPage, search: searchDebounced, status: activeFilter });
    }, [currentPage, searchDebounced, activeFilter]);

    // Silent refresh every 10s for live position updates
    useEffect(() => {
        const interval = setInterval(() => {
            fetchOrders(true);
        }, 10000);
        return () => clearInterval(interval);
    }, [currentPage, searchDebounced, activeFilter]);

    // Reset page when search/filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchDebounced, activeFilter]);

    useEffect(() => {
        const room = socketClient.joinFleetRoomFromStorage();
        if (room) {
            console.log(`Subscribed to ${room}`);
        }

        const offStatus = socketClient.on('order_status_updated', (payload: any) => {
            console.log('Order update received:', payload);
            debouncedRefresh();
        });

        const offRoute = socketClient.on('route_updated', (payload: any) => {
            console.log('Route update received, debounced refresh:', payload);
            debouncedRefresh();
        });

        const offNew = socketClient.on('orders:new', (payload: any) => {
            console.log('New order received:', payload);
            fetchOrders(true);
        });

        return () => {
            offStatus();
            offRoute();
            offNew();
            if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        };
    }, []);

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('fr-FR', {
            notation: 'compact',
            maximumFractionDigits: 2
        }).format(num).replace(',', '.');
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'DELIVERED':
                return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20';
            case 'PENDING':
                return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20';
            case 'IN_TRANSIT':
            case 'ACCEPTED':
                return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20';
            case 'PICKING_UP':
            case 'AT_PICKUP':
            case 'COLLECTED':
                return 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20';
            case 'AT_DELIVERY':
                return 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-100 dark:border-cyan-500/20';
            case 'FAILED':
                return 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-500/20';
            default:
                return 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-400 border-gray-100 dark:border-slate-700';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'DELIVERED': return <CheckCircle2 size={14} />;
            case 'PENDING': return <Clock size={14} />;
            case 'IN_TRANSIT':
            case 'ACCEPTED': return <Truck size={14} />;
            case 'PICKING_UP':
            case 'AT_PICKUP':
            case 'COLLECTED': return <Package size={14} />;
            default: return <AlertCircle size={14} />;
        }
    };

    const setRecentFilter = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        setFilters({
            ...filters,
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        });
    };

    // Advanced client-side filters (dates, amounts, modes — not handled by server)
    const filteredOrders = (orders || []).filter(order => {
        if (filters.startDate) {
            if (new Date(order.timestamps.createdAt) < new Date(filters.startDate)) return false;
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59);
            if (new Date(order.timestamps.createdAt) > end) return false;
        }
        if (filters.minAmount && (order.pricing?.amount || 0) < Number(filters.minAmount)) return false;
        if (filters.maxAmount && (order.pricing?.amount || 0) > Number(filters.maxAmount)) return false;
        if (order.assignment?.mode && !filters.modes.includes(order.assignment.mode)) return false;
        if (filters.type === 'RECEIVED' && order.assignment?.mode !== 'TARGET') return false;
        if (filters.type === 'EMITTED' && order.assignment?.mode === 'TARGET') return false;
        return true;
    });

    // Pagination from server meta
    const totalPages = paginationMeta.lastPage;
    const safePage = paginationMeta.currentPage;

    // --- Helpers ---
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // in metres
    };

    const calculateProximityRatio = (order: OrderSummary) => {
        const driverPos = order.attribution?.driver.position;
        const lastStop = order.itinerary.stops.last;
        const nextStop = order.itinerary.stops.next;

        if (!driverPos?.lat || !driverPos?.lng || !lastStop?.lat || !lastStop?.lng || !nextStop?.lat || !nextStop?.lng) {
            return 0;
        }

        const totalDist = getDistance(lastStop.lat, lastStop.lng, nextStop.lat, nextStop.lng);
        const distToNext = getDistance(driverPos.lat, driverPos.lng, nextStop.lat, nextStop.lng);

        if (totalDist <= 0) return 0;
        let ratio = 1 - (distToNext / totalDist);

        return Math.min(Math.max(ratio, 0), 1);
    };


    // --- UI Components ---
    const OrderCard = ({ order }: { order: OrderSummary }) => {
        const [copied, setCopied] = useState(false);
        const driverName = order.attribution?.driver?.name?.trim() || 'Chauffeur';
        const driverInitials = driverName
            .split(/\s+/)
            .filter(Boolean)
            .map((part) => part[0])
            .join('')
            .substring(0, 2) || 'CH';
        const driverFirstName = driverName.split(/\s+/)[0] || 'Chauffeur';

        const handleCopyId = (e: React.MouseEvent) => {
            e.stopPropagation();
            navigator.clipboard.writeText(order.id);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        };

        const isFinished = order.status === 'DELIVERED';

        return (
            <div
                onClick={() => window.location.href = `/orders/${order.id}`}
                className="group relative bg-white/60 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[32px] border border-white dark:border-slate-800/50 p-6 shadow-sm hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col gap-5"
            >
                {/* Template 3D Background Accent */}
                <img
                    src={`/assets/${(order.template || 'COMMANDE').toLowerCase()}_bg.png`}
                    className="absolute -top-6 -right-6 w-[120px] h-32 object-cover opacity-60 pointer-events-none group-hover:scale-110 transition-transform duration-700"
                    alt=""
                />

                {/* Header */}
                <div className="flex items-start justify-between relative z-10">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 group/id">
                            <span className="font-mono text-[13px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {formatId(order.id)}
                            </span>
                            <button
                                onClick={handleCopyId}
                                className="opacity-0 group-hover/id:opacity-100 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all"
                            >
                                {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-slate-400" />}
                            </button>
                            {order.itinerary.progressPercent > 0 && order.itinerary.progressPercent < 100 && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-500/10 rounded-md">
                                    <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
                                    <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">Live</span>
                                </div>
                            )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Clock size={10} />
                            {new Date(order.timestamps.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} • {new Date(order.timestamps.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    {order.attribution ? (
                        <div className="flex items-center gap-2.5 bg-white/40 dark:bg-slate-800/40 p-1.5 pr-3 rounded-full border border-white/60 dark:border-slate-800/50 shadow-sm">
                            <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-[10px] font-black text-white shadow-sm ring-2 ring-white dark:ring-slate-900 uppercase">
                                    {driverInitials}
                                </div>
                                <div className="absolute -right-1 -bottom-1 w-4 h-4 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                                    <Truck size={10} className="text-slate-400" />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-none">{driverFirstName}</span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{order.attribution.vehicle?.plate || 'Sans vhc'}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50/50 dark:bg-slate-800/50 rounded-full border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 italic">
                            <span className="text-[10px] font-bold uppercase tracking-widest">En attente...</span>
                        </div>
                    )}
                </div>

                {/* Itinerary Timeline - Match App Style */}
                <div className="flex flex-col gap-2 relative z-10 py-1">
                    {/* Last Visited Stop - Always show dot to preserve spacing */}
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${order.itinerary.stops.last ? 'bg-emerald-500 border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`} />
                        {order.itinerary.stops.last && (
                            <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-0.5">Dernier visité</span>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                                    {order.itinerary.stops.last?.address || order.itinerary.display.from}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* The LIVE Road + Moto (Horizontal continuous line) */}
                    <div className="flex items-center h-8 relative px-[6px]">
                        {/* Background Road Line */}
                        <div className="absolute left-[6px] right-[6px] h-0.5 border-t-2 border-dashed border-slate-200 dark:border-slate-800/80 z-0" />

                        {!isFinished && (
                            <>
                                {/* Active Road Progress */}
                                <div
                                    className="absolute left-[6px] h-0.5 border-t-2 border-dashed border-emerald-400 z-10 transition-all duration-1000"
                                    style={{ width: `${calculateProximityRatio(order) * 100}%` }}
                                />

                                {/* Moto sliding on the road - Only if assigned */}
                                {order.attribution && (
                                    <div
                                        className="relative z-20 transition-all duration-1000 ease-in-out"
                                        style={{ left: `calc(${calculateProximityRatio(order) * 100}% - 14px)` }}
                                    >
                                        <div className={`w-7 h-7 rounded-full ${order.attribution.driver.position?.lat ? 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]' : 'bg-slate-400 dark:bg-slate-600'} flex items-center justify-center flex-shrink-0`}>
                                            <Bike size={14} className="text-white" />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {isFinished && (
                            <div className="absolute left-[6px] right-[6px] h-0.5 border-t-2 border-dashed border-emerald-500 z-10" />
                        )}
                    </div>

                    {/* Next Stop - Aligned to the Right */}
                    <div className="flex items-center justify-end gap-3 text-right">
                        <div className="flex flex-col min-w-0 items-end">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-0.5">Prochaine étape</span>
                            <span className="text-sm font-black text-slate-900 dark:text-slate-100 truncate max-w-full">
                                {order.itinerary.stops.next?.address || order.itinerary.display.to}
                            </span>
                        </div>
                        <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${!isFinished && order.itinerary.progressPercent > 0 ? 'bg-indigo-100 dark:bg-indigo-900 border-indigo-400 animate-pulse' : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`} />
                    </div>
                </div>

                {/* Progress Bar - Bilan Style */}
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bilan Mission</span>
                        <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-black ${isFinished ? 'text-emerald-500' : 'text-indigo-500'}`}>
                                {isFinished ? '100%' : `${Math.round(order.itinerary.progressPercent)}%`}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                                <MapPin size={10} />{order.itinerary.visitedCount}/{order.itinerary.totalStops}
                            </span>
                        </div>
                    </div>
                    <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden p-0.5 shadow-inner">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${isFinished ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-gradient-to-r from-indigo-500 to-cyan-400 shadow-[0_0_8px_rgba(99,102,241,0.4)]'}`}
                            style={{ width: `${isFinished ? 100 : order.itinerary.progressPercent}%` }}
                        />
                    </div>

                    {/* Action Quantities Summary - Based on Next Stop Actions */}
                    <div className="flex items-center justify-end gap-3 mt-2">
                        {(order.itinerary.stops.next?.actions?.pickup ?? 0) > 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-md border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                <PackagePlus size={10} strokeWidth={3} />
                                <span className="text-[10px] font-black">{order.itinerary.stops.next?.actions?.pickup}</span>
                            </div>
                        )}
                        {(order.itinerary.stops.next?.actions?.drop ?? 0) > 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 rounded-md border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400">
                                <PackageCheck size={10} strokeWidth={3} />
                                <span className="text-[10px] font-black">{order.itinerary.stops.next?.actions?.drop}</span>
                            </div>
                        )}
                        {(order.itinerary.stops.next?.actions?.service ?? 0) > 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 dark:bg-amber-500/10 rounded-md border border-amber-100 dark:border-amber-500/20 text-amber-600 dark:text-amber-400">
                                <Hammer size={10} strokeWidth={3} />
                                <span className="text-[10px] font-black">{order.itinerary.stops.next?.actions?.service}</span>
                            </div>
                        )}
                    </div>
                </div>


                {/* Footer - Regression & Status Area */}
                <div className="mt-auto pt-4 flex flex-col gap-4 relative z-10 border-t border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-lg font-black text-slate-900 dark:text-slate-100 leading-none">
                                {order.pricing.amount.toLocaleString()} {order.pricing.currency}
                            </span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Montant HT</span>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${getStatusStyles(order.status)}`}>
                                {order.status.replace('_', ' ')}
                            </span>
                            {order.assignment.priority === 'HIGH' && (
                                <div className="flex items-center gap-1 text-rose-500">
                                    <Star size={10} fill="currentColor" />
                                    <span className="text-[9px] font-black uppercase tracking-tighter">Prioritaire</span>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        );
    };

    const statusFilters = [
        { id: 'ALL', label: 'Tout', icon: <Layers size={14} />, count: footerCounts?.ALL ?? orders.length },
        { id: 'PENDING', label: 'En attente', icon: <Clock size={14} />, count: footerCounts?.PENDING ?? orders.filter(o => o.status === 'PENDING').length },
        { id: 'IN_PROGRESS', label: 'En cours', icon: <Truck size={14} />, count: footerCounts?.IN_PROGRESS ?? orders.filter(o => ['ACCEPTED', 'AT_PICKUP', 'PICKING_UP', 'COLLECTED', 'AT_DELIVERY', 'IN_TRANSIT'].includes(o.status)).length },
        { id: 'DELIVERED', label: 'Livrées', icon: <CheckCircle2 size={14} />, count: footerCounts?.DELIVERED ?? orders.filter(o => o.status === 'DELIVERED').length },
        { id: 'INCIDENTS', label: 'Incidents', icon: <AlertCircle size={14} />, count: footerCounts?.INCIDENTS ?? orders.filter(o => o.status === 'FAILED').length }
    ];

    return (
        <div className="space-y-6 pt-2 max-w-[1600px] mx-auto px-4 pb-40">
            <div className="bg-gradient-to-br from-indigo-600 to-cyan-600 rounded-[3rem] p-6 md:p-10 text-white shadow-2xl shadow-indigo-500/30 relative overflow-hidden group">
                {/* 3D Asset Background */}
                <div className="absolute top-0 right-0 w-[100%] h-[120%] -translate-y-[10%] group-hover:scale-105 transition-all duration-1000 pointer-events-none opacity-90">
                    <div className='relative w-full h-full'>
                        <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-gray-900 to-transparent z-10"></div>
                        <img
                            src="/assets/green_blue_glass_shape.png"
                            className="w-full h-full object-cover object-right"
                            alt="3D glass shape"
                        />
                    </div>
                </div>
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20">
                                <ShoppingBag size={28} />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Opérations</span>
                                <h2 className="text-4xl font-black">Centre de Contrôle</h2>
                            </div>
                        </div>
                        <p className="text-indigo-50 leading-relaxed font-medium">
                            Supervisez vos expéditions, gérez les interventions techniques et suivez votre flotte.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            {['COMMANDE', 'VOYAGE', 'MISSION'].map((type) => {
                                const stat = orderStats?.templates?.find((t: any) => t.template === type);
                                return (
                                    <span key={type} className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-black uppercase border border-white/20 flex items-center gap-2">
                                        <span className="opacity-60">{type}</span>
                                        <span className="text-white">{stat?.count ?? 0}</span>
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white/10 rounded-[2.5rem] p-6 md:p-8 backdrop-blur-md border border-white/10 flex flex-col justify-between hidden md:flex">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest">Opérations en cours</p>
                                <div className="flex items-end mt-1">
                                    <p className="text-3xl font-black leading-none">{orderStats?.inProgressCount ?? '...'} <span className="text-xs opacity-60 font-medium">actives</span></p>

                                    {/* Mini Trend Graph (SVG) */}
                                    <div className="w-[120px] h-[40px] ml-4 relative overflow-visible opacity-90 drop-shadow-md hidden lg:block">
                                        <svg viewBox="0 0 120 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                                            <defs>
                                                <linearGradient id="trend-gradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.4" />
                                                    <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>

                                            {/* Dynamic Area under the curve */}
                                            {orderStats?.dailyCounts && (
                                                <path
                                                    d={(() => {
                                                        const counts = orderStats.dailyCounts.map((d: any) => d.count);
                                                        const max = Math.max(...counts, 1);
                                                        const points = counts.map((c: number, i: number) => {
                                                            const x = (i / 6) * 120;
                                                            const y = 40 - (c / max) * 35;
                                                            return `${x},${y}`;
                                                        });
                                                        return `M0,40 L${points.join(' ')} L120,40 Z`;
                                                    })()}
                                                    fill="url(#trend-gradient)"
                                                />
                                            )}

                                            {/* Dynamic Stroke Line */}
                                            {orderStats?.dailyCounts && (
                                                <path
                                                    d={(() => {
                                                        const counts = orderStats.dailyCounts.map((d: any) => d.count);
                                                        const max = Math.max(...counts, 1);
                                                        const points = counts.map((c: number, i: number) => {
                                                            const x = (i / 6) * 120;
                                                            const y = 40 - (c / max) * 35;
                                                            return `${x},${y}`;
                                                        });
                                                        return `M${points.join(' ')}`;
                                                    })()}
                                                    fill="none"
                                                    stroke="#34d399"
                                                    strokeWidth="2.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="drop-shadow-[0_2px_4px_rgba(52,211,153,0.5)]"
                                                />
                                            )}

                                            {/* Last Dot indicating current state */}
                                            {orderStats?.dailyCounts && (
                                                <circle
                                                    cx="120"
                                                    cy={40 - (orderStats.dailyCounts[6].count / Math.max(...orderStats.dailyCounts.map((d: any) => d.count), 1)) * 35}
                                                    r="3"
                                                    fill="#ffffff"
                                                    stroke="#34d399"
                                                    strokeWidth="2"
                                                />
                                            )}
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest">Taux Complétion</p>
                                <p className="text-sm font-black uppercase tracking-widest text-emerald-300">
                                    {orderStats?.completionRate ?? '0'}%
                                </p>
                            </div>
                        </div>
                        <div className="h-px bg-white/20 my-4"></div>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest">Volume (7 j)</p>
                                <p className="text-xl font-bold truncate max-w-[150px]">{orderStats?.total7d ?? '0'} Missions</p>
                            </div>
                            <button
                                onClick={handleNewOrder}
                                className="relative z-10 bg-white text-indigo-600 px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-xl shadow-black/10 hover:shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap overflow-hidden"
                            >
                                <span className="relative z-10">Créer une mission</span>
                                <ArrowRight size={16} className="relative z-10 hidden sm:block" />
                            </button>
                        </div>
                    </div>

                    {/* Mobile button variant inside Hero */}
                    <div className="md:hidden">
                        <button
                            onClick={handleNewOrder}
                            className="w-full relative z-10 bg-white text-indigo-600 px-6 py-4 rounded-2xl font-black uppercase text-xs shadow-xl shadow-black/10 hover:shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="relative z-10">Nouvelle Opération</span>
                            <ArrowRight size={16} className="relative z-10" />
                        </button>
                    </div>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 relative">
                {error && (
                    <div className="m-4 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-400 font-bold text-sm animate-in slide-in-from-top-4">
                        <AlertCircle size={18} />
                        {error}
                        <button onClick={() => fetchOrders()} className="ml-auto px-3 py-1 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-500/30 rounded-lg text-xs hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-all dark:text-rose-400">
                            Réessayer
                        </button>
                    </div>
                )}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col gap-3 relative z-20 rounded-t-3xl">
                    {/* Row 1: Search */}
                    <div className="flex justify-between sm:justify-start items-center gap-2 w-full">
                        <div className="relative group min-w-0 max-w-md w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Réf. ou téléphone client..."
                                className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm text-sm dark:text-slate-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors p-1.5 rounded-lg ${showFilters ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >
                                <Filter size={14} />
                            </button>
                        </div>
                        {/* New Order Mobile Button - Only shown if Hero isn't used or we want a quick access */}
                        <button
                            onClick={handleNewOrder}
                            className="flex items-center justify-center gap-2 bg-indigo-600 text-white p-2.5 rounded-xl text-[11px] font-black shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex-shrink-0 md:hidden"
                            title="Nouvelle Mission"
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    {/* Row 2: Status filter tabs (horizontal scroll on mobile) */}
                    <div className="flex items-center gap-1.5 p-1 bg-slate-200/50 dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700 overflow-x-auto scrollbar-hide">
                        {statusFilters.map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setActiveFilter(filter.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${activeFilter === filter.id
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                            >
                                {filter.icon}
                                <span>{filter.label}</span>
                                <span className={`px-1.5 py-0.5 rounded-lg text-[10px] ${activeFilter === filter.id ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                    }`}>
                                    {formatNumber(filter.count)}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Advanced Filter Panel */}
                {showFilters && (
                    <div className="absolute top-16 left-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-50 animate-in slide-in-from-top-4 duration-300 w-full max-w-2xl xl:w-[600px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <Filter size={18} className="text-indigo-600 dark:text-indigo-400" />
                                Filtres avancés
                            </h3>
                            <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Dates Section */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Période</label>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <input
                                        type="date"
                                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg text-xs dark:text-slate-200"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                    />
                                    <input
                                        type="date"
                                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg text-xs dark:text-slate-200"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { l: '24h', v: 1 },
                                        { l: '3j', v: 3 },
                                        { l: '7j', v: 7 },
                                        { l: '1m', v: 30 }
                                    ].map(p => (
                                        <button
                                            key={p.l}
                                            onClick={() => setRecentFilter(p.v)}
                                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg text-xs font-bold transition-all"
                                        >
                                            {p.l}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Amount Section */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant [Min - Max]</label>
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-1">
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg text-xs pl-8 dark:text-slate-200"
                                            value={filters.minAmount}
                                            onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                                        />
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">FCFA</span>
                                    </div>
                                    <div className="w-4 h-0.5 bg-slate-200 dark:bg-slate-800"></div>
                                    <div className="relative flex-1">
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg text-xs pl-8 dark:text-slate-200"
                                            value={filters.maxAmount}
                                            onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                                        />
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">FCFA</span>
                                    </div>
                                </div>
                            </div>

                            {/* Type & Mode Section */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type de commande</label>
                                <div className="flex gap-2">
                                    {[
                                        { id: 'ALL', label: 'Tout' },
                                        { id: 'RECEIVED', label: 'Reçues' },
                                        { id: 'EMITTED', label: 'Émises' }
                                    ].map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setFilters({ ...filters, type: t.id })}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${filters.type === t.id ? 'bg-slate-900 dark:bg-slate-700 border-slate-900 dark:border-slate-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode d'attribution</label>
                                <div className="flex gap-2">
                                    {['GLOBAL', 'INTERNAL', 'TARGET'].map(m => (
                                        <button
                                            key={m}
                                            onClick={() => {
                                                const newModes = filters.modes.includes(m)
                                                    ? filters.modes.filter(mode => mode !== m)
                                                    : [...filters.modes, m];
                                                setFilters({ ...filters, modes: newModes });
                                            }}
                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${filters.modes.includes(m) ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300'
                                                }`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setFilters({
                                        startDate: '',
                                        endDate: '',
                                        minAmount: '',
                                        maxAmount: '',
                                        modes: ['GLOBAL', 'INTERNAL', 'TARGET'],
                                        type: 'ALL'
                                    });
                                }}
                                className="px-4 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-bold transition-colors"
                            >
                                Réinitialiser
                            </button>
                            <button
                                onClick={() => setShowFilters(false)}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-100 dark:shadow-none hover:scale-[1.05] transition-all"
                            >
                                Appliquer les filtres
                            </button>
                        </div>
                    </div>
                )}

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {filteredOrders.length > 0 ? (
                            filteredOrders.map((order) => (
                                <OrderCard key={order.id} order={order} />
                            ))
                        ) : (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-full">
                                    <ShoppingBag size={48} className="text-slate-200 dark:text-slate-700" />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-lg dark:text-slate-300">Aucune mission trouvée</p>
                                    <p className="text-sm opacity-60">Essayez d'ajuster vos filtres ou lancez une recherche.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-slate-50/30 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-slate-500 dark:text-slate-400 rounded-b-3xl">
                    <p className="text-xs">
                        <b>{(safePage - 1) * ITEMS_PER_PAGE + 1}</b>–<b>{Math.min(safePage * ITEMS_PER_PAGE, paginationMeta.total)}</b> sur <b>{paginationMeta.total}</b> missions
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={safePage <= 1}
                            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-bold text-xs text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            ← <span className="hidden sm:inline">Préc.</span>
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                            .reduce<(number | string)[]>((acc, p, idx, arr) => {
                                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((p, i) =>
                                typeof p === 'string' ? (
                                    <span key={`dots-${i}`} className="px-1 text-slate-300 dark:text-slate-600 text-xs">…</span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => setCurrentPage(p)}
                                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${p === safePage
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                )
                            )
                        }
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={safePage >= totalPages}
                            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-bold text-xs text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <span className="hidden sm:inline">Suiv.</span> →
                        </button>
                    </div>
                </div>
            </div>

            {/* New Order Template Modal */}
            <AnimatePresence>
                {showNewOrderModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
                        onClick={() => setShowNewOrderModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Créer une nouvelle opération</h2>
                                    <p className="text-slate-500 text-sm mt-1">Sélectionnez le modèle métier adapté à votre besoin.</p>
                                </div>
                                <button
                                    onClick={() => setShowNewOrderModal(false)}
                                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 dark:bg-slate-900/10">
                                {/* COMMANDE */}
                                <button
                                    onClick={() => handleCreateTemplate('COMMANDE')}
                                    className="relative flex flex-col overflow-hidden rounded-[2.5rem] p-6 text-white shadow-xl transition-all duration-500 group bg-gradient-to-br from-indigo-500 to-blue-700 hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1 text-left"
                                >
                                    {/* 3D Asset Background */}
                                    <div className="absolute -bottom-5 -right-10 w-full h-[70%] group-hover:scale-105 transition-transform duration-1000 pointer-events-none opacity-90">
                                        <div className="relative w-full h-full">
                                            {/* <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-gray-900/40 to-gray-500/40 z-10"></div> */}
                                            <img
                                                src="/assets/commande_bg.png"
                                                className="w-full h-full object-contain object-right mix-blend-screen"
                                                alt="Livraison"
                                            />
                                        </div>
                                    </div>

                                    <div className="relative z-20 flex-1 flex flex-col">
                                        {/* <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white mb-5 shadow-sm">
                                            <Box size={24} />
                                        </div> */}
                                        <h3 className="text-xl font-black mb-2 tracking-tight">COMMANDE</h3>
                                        <p className="text-sm font-medium leading-relaxed opacity-90 mb-6 flex-1">
                                            Livraison de colis d'un point A à un point B. (Intègre la gestion financière)
                                        </p>
                                        <div className="flex items-center text-white text-xs font-black uppercase tracking-widest mt-auto group-hover:gap-2 transition-all">
                                            Démarrer <ArrowRight size={14} className="ml-1.5" />
                                        </div>
                                    </div>
                                </button>

                                {/* MISSION */}
                                <button
                                    onClick={() => handleCreateTemplate('MISSION')}
                                    className="relative flex flex-col overflow-hidden rounded-[2.5rem] p-6 text-white shadow-xl transition-all duration-500 group bg-gradient-to-br from-emerald-500 to-emerald-700 hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-1 text-left"
                                >
                                    {/* 3D Asset Background */}
                                    <div className="absolute -bottom-5 -right-10 w-full h-[70%] group-hover:scale-105 transition-transform duration-1000 pointer-events-none opacity-90">
                                        <div className="relative w-full h-full">
                                            {/* <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-gray-900/40 to-gray-500/40 z-10"></div> */}
                                            <img
                                                src="/assets/mission_bg.png"
                                                className="w-full h-full object-contain object-right mix-blend-screen"
                                                alt="Missions"
                                            />
                                        </div>
                                    </div>

                                    <div className="relative z-20 flex-1 flex flex-col">
                                        {/* <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white mb-5 shadow-sm">
                                            <Briefcase size={24} />
                                        </div> */}
                                        <h3 className="text-xl font-black mb-2 tracking-tight">MISSION</h3>
                                        <p className="text-sm font-medium leading-relaxed opacity-90 mb-6 flex-1">
                                            Tournées et interventions techniques. Assignation sans blocage de fonds.
                                        </p>
                                        <div className="flex items-center text-white text-xs font-black uppercase tracking-widest mt-auto group-hover:gap-2 transition-all">
                                            Démarrer <ArrowRight size={14} className="ml-1.5" />
                                        </div>
                                    </div>
                                </button>

                                {/* VOYAGE */}
                                <button
                                    onClick={() => handleCreateTemplate('VOYAGE')}
                                    className="relative flex flex-col overflow-hidden rounded-[2.5rem] p-6 text-white shadow-xl transition-all duration-500 group bg-gradient-to-br from-purple-500 to-violet-700 hover:shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-1 text-left"
                                >
                                    {/* 3D Asset Background */}
                                    {/* <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-gray-900/40 to-gray-500/40 z-10"></div> */}
                                    <div className="absolute -bottom-5 -right-10 w-full h-[70%]  group-hover:scale-105 transition-transform duration-1000 pointer-events-none opacity-90">
                                        <div className="relative w-full h-full">
                                            <img
                                                src="/assets/voyage_bg.png"
                                                className="w-full h-full object-contain object-right mix-blend-screen"
                                                alt="Voyage"
                                            />
                                        </div>
                                    </div>

                                    <div className="relative z-20 flex-1 flex flex-col">
                                        {/* <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white mb-5 shadow-sm">
                                            <Bus size={24} />
                                        </div> */}
                                        <h3 className="text-xl font-black mb-2 tracking-tight">VOYAGE</h3>
                                        <p className="text-sm mb-24 font-medium leading-relaxed opacity-90 mb-6 flex-1">
                                            Transport public, billetterie, gestion des lignes et réservation.
                                        </p>
                                        <div className="flex items-center text-white text-xs font-black uppercase tracking-widest mt-auto group-hover:gap-2 transition-all">
                                            Démarrer <ArrowRight size={14} className="ml-1.5" />
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
