import React, { useEffect, useState, useRef } from 'react';
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
    X
} from 'lucide-react';
import { Order } from '../../../api/orders';

// Mocked Orders for the Premium Demo
import { ordersApi } from '../../../api/orders';
import { mockService, Order as MockOrder } from '../../../api/mock';
import { socketClient } from '../../../api/socket';
import { useHeaderAutoHide } from '../../../hooks/useHeaderAutoHide';
import { useHeader } from '../../../context/HeaderContext';
import LocationSearchBar from '../../../components/LocationSearchBar';

export default function Page() {
    useHeaderAutoHide();
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [showFilters, setShowFilters] = useState(false);
    const { setHeaderContent, clearHeaderContent } = useHeader();

    const handleNewOrder = async () => {
        try {
            const { order } = await ordersApi.initiate();
            window.location.href = `/orders/${order.id}`;
        } catch (err) {
            console.error("Failed to initiate order:", err);
            setError("Erreur lors de la création de la commande.");
        }
    };

    useEffect(() => {
        setHeaderContent(
            <div className="flex items-center justify-between gap-4 w-full">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <ShoppingBag size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">Missions</h1>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Temps réel • {orders.length} commandes</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleNewOrder}
                        className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200/50 dark:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus size={16} />
                        <span className="hidden sm:inline">Nouvelle Mission</span>
                    </button>
                </div>
            </div>
        );
        return () => clearHeaderContent();
    }, [setHeaderContent, clearHeaderContent]);

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

    const fetchOrders = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await ordersApi.list();
            // Transform backend data to match UI expected structure if necessary
            const transformed = data.map((ord: any) => ({
                ...ord,
                pricingData: {
                    ...ord.pricingData,
                    finalPrice: ord.pricingData?.clientFee || 0
                },
                items: ord.packages || []
            }));
            setOrders(transformed);
        } catch (error: any) {
            console.error("Failed to fetch orders:", error);
            setError("Impossible de charger le flux de commandes. Veuillez vérifier votre connexion au serveur.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();

        // Socket integration
        const socket = socketClient.connect();
        const userStr = localStorage.getItem('delivery_user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                const companyId = user.effectiveCompanyId || user.companyId;
                if (companyId) {
                    socket.emit('join', `fleet:${companyId}`);
                    console.log(`Subscribed to fleet:${companyId}`);
                }
            } catch (e) { }
        }

        socket.connect();

        socket.on('order_status_updated', (payload: any) => {
            console.log('Order update received:', payload);
            setOrders(prev => prev.map(ord =>
                ord.id === payload.orderId
                    ? { ...ord, status: payload.status }
                    : ord
            ));
        });

        socket.on('route_updated', (payload: any) => {
            console.log('Route update received, refreshing list:', payload);
            fetchOrders();
        });

        socket.on('orders:new', (payload: any) => {
            console.log('New order received:', payload);
            fetchOrders(); // Refresh list on new order
        });

        return () => {
            socket.off('order_status_updated');
            socket.off('route_updated');
            socket.off('orders:new');
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

    const filteredOrders = orders.filter(order => {
        // Search Term: ID or Phone
        if (searchTerm) {
            const matchesId = order.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesPhone = order.driver?.phone?.includes(searchTerm) || (order.pickupAddress as any)?.phone?.includes(searchTerm) || (order.deliveryAddress as any)?.phone?.includes(searchTerm);
            if (!matchesId && !matchesPhone) return false;
        }

        // Status Filter
        if (activeFilter !== 'ALL') {
            if (activeFilter === 'IN_PROGRESS' && !['IN_TRANSIT', 'PICKING_UP', 'ACCEPTED', 'AT_PICKUP', 'COLLECTED', 'AT_DELIVERY'].includes(order.status)) return false;
            if (activeFilter === 'PENDING' && order.status !== 'PENDING') return false;
            if (activeFilter === 'DELIVERED' && order.status !== 'DELIVERED') return false;
            // INCIDENTS could be matched by a specific field or status if available
        }

        // Advanced: Dates
        if (filters.startDate) {
            if (new Date(order.createdAt) < new Date(filters.startDate)) return false;
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59);
            if (new Date(order.createdAt) > end) return false;
        }

        // Advanced: Amount
        if (filters.minAmount && (order.pricingData.finalPrice || 0) < Number(filters.minAmount)) return false;
        if (filters.maxAmount && (order.pricingData.finalPrice || 0) > Number(filters.maxAmount)) return false;

        // Advanced: Mode
        if (!filters.modes.includes(order.assignmentMode)) return false;

        // Advanced: Type (Simulation: Received if target, Emitted if internal/global by default for this ETP)
        if (filters.type === 'RECEIVED' && order.assignmentMode !== 'TARGET') return false;
        if (filters.type === 'EMITTED' && order.assignmentMode === 'TARGET') return false;

        return true;
    });

    const statusFilters = [
        { id: 'ALL', label: 'Tout', icon: <Layers size={14} />, count: orders.length },
        { id: 'PENDING', label: 'En attente', icon: <Clock size={14} />, count: orders.filter(o => o.status === 'PENDING').length },
        { id: 'IN_PROGRESS', label: 'En cours', icon: <Truck size={14} />, count: orders.filter(o => ['ACCEPTED', 'AT_PICKUP', 'COLLECTED', 'AT_DELIVERY', 'IN_TRANSIT'].includes(o.status)).length },
        { id: 'DELIVERED', label: 'Livrées', icon: <CheckCircle2 size={14} />, count: orders.filter(o => o.status === 'DELIVERED').length },
        { id: 'INCIDENTS', label: 'Incidents', icon: <AlertCircle size={14} />, count: orders.filter(o => o.status === 'FAILED').length }
    ];

    return (
        <div className="space-y-6 pt-2">

            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 relative">
                {error && (
                    <div className="m-4 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-400 font-bold text-sm animate-in slide-in-from-top-4">
                        <AlertCircle size={18} />
                        {error}
                        <button onClick={fetchOrders} className="ml-auto px-3 py-1 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-500/30 rounded-lg text-xs hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-all dark:text-rose-400">
                            Réessayer
                        </button>
                    </div>
                )}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col xl:flex-row gap-4 justify-between items-center relative z-20 rounded-t-3xl">
                    <div className="flex items-center gap-4 w-full md:max-w-2xl">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Réf. ou téléphone client..."
                                className="w-full pl-10 pr-10 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm text-sm dark:text-slate-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors p-1.5 rounded-lg ${showFilters ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-50'}`}
                            >
                                <Filter size={14} />
                            </button>
                        </div>

                        <div className="w-64 hidden md:block">
                            <LocationSearchBar
                                onLocationSelect={(loc) => {
                                    console.log("Location selected in orders list:", loc);
                                    // Potential toggle for map view or distance filtering here
                                }}
                                placeholder="Rechercher un lieu..."
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/50 dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700">
                        {statusFilters.map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setActiveFilter(filter.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeFilter === filter.id
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

                <div className="overflow-hidden rounded-b-3xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-slate-400 dark:text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                                    <th className="px-6 py-4">Référence / Date</th>
                                    <th className="px-6 py-4">Articles</th>
                                    <th className="px-6 py-4">Itinéraire</th>
                                    <th className="px-6 py-4">Statut</th>
                                    <th className="px-6 py-4">Attribution</th>
                                    <th className="px-6 py-4 text-right">Montant</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all cursor-pointer" onClick={() => window.location.href = `/orders/${order.id}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase">
                                                    {order.id.replace('ord_', '#')}
                                                </span>
                                                <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1.5">
                                                    <Clock size={12} />
                                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg">
                                                        <Package size={14} className="text-slate-500 dark:text-slate-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        {(order as any).items?.[0]?.name || 'Sans titre'}
                                                    </span>
                                                </div>
                                                {(order as any).items?.length > 1 && (
                                                    <span className="text-[10px] text-indigo-500 font-bold ml-8">
                                                        + {(order as any).items.length - 1} AUTRES ARTICLES
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 max-w-[200px]">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                                                    <span className="text-slate-500 dark:text-slate-400 truncate">{order.pickupAddress?.formattedAddress || 'Adresse inconnue'}</span>
                                                </div>
                                                <div className="w-0.5 h-2 bg-slate-200 dark:bg-slate-800 ml-[2.5px]"></div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <MapPin size={12} className="text-rose-400" />
                                                    <span className="text-slate-900 dark:text-slate-200 font-medium truncate">{order.deliveryAddress?.formattedAddress || 'Adresse inconnue'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors ${getStatusStyles(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                {order.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {order.driver ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800 border-2 border-white dark:border-slate-900 shadow-sm flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400">
                                                        {(order.driver.name || order.driver.phone || 'D').toString().split(' ').map((n: string) => n[0] || '').join('').toUpperCase().substring(0, 2)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{order.driver.name || 'Chauffeur sans nom'}</span>
                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                                            <Truck size={10} /> {order.assignmentMode}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs italic">
                                                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700">
                                                        ?
                                                    </div>
                                                    <span>Recherche en cours...</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{(order.pricingData?.finalPrice || 0).toLocaleString()} FCFA</span>
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Taxes incluses</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <button className="p-2 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 rounded-lg transition-all">
                                                <ChevronRight size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 bg-slate-50/30 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
                        <p>Affichage de <b>{filteredOrders.length}</b> commandes sur <b>28</b> au total</p>
                        <div className="flex gap-2">
                            <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium text-slate-600 dark:text-slate-300 disabled:opacity-50">Précédent</button>
                            <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium text-slate-600 dark:text-slate-300">Suivant</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
