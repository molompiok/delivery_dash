import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapLibre as GoogleMap, Marker, Polyline } from '../../components/MapLibre';
import {
    User, Truck, MapPin, Clock, Package, ChevronRight, ChevronDown,
    CheckCircle2, XCircle, Snowflake, Play, Square, AlertTriangle,
    Loader2, RefreshCw, LogIn, Eye, ArrowLeft, Navigation, Camera, KeyRound
} from 'lucide-react';
import { socketClient } from '../../api/socket';

// ─── API HELPER ───
const API_BASE = (() => {
    if ((import.meta as any).env?.VITE_API_URL) return (import.meta as any).env.VITE_API_URL;
    if (typeof window !== 'undefined') return `http://${window.location.hostname}:3333/v1`;
    return 'http://localhost:3333/v1';
})();

async function api(token: string, method: string, path: string, body?: any) {
    const cleanToken = token.trim().replace(/[^a-zA-Z0-9._\-]/g, '');
    console.log('[API]', method, path, '| token length:', cleanToken.length, '| first 20:', cleanToken.substring(0, 20));
    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cleanToken}` },
        body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
}

async function apiForm(token: string, path: string, formData: FormData) {
    const cleanToken = token.trim().replace(/[^a-zA-Z0-9._\-]/g, '');
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${cleanToken}` },
        body: formData,
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
}

// ─── TYPES ───
type View = 'driver' | 'orders' | 'detail';
type OrderStatus = 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'DELIVERED' | 'FAILED' | 'CANCELLED';
type StopStatus = 'PENDING' | 'ARRIVED' | 'PARTIAL' | 'COMPLETED' | 'FAILED';
type ActionStatus = 'PENDING' | 'ARRIVED' | 'COMPLETED' | 'FROZEN' | 'FAILED' | 'CANCELLED';

// ─── STATUS BADGES ───
const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600', PENDING: 'bg-amber-100 text-amber-700',
    ACCEPTED: 'bg-blue-100 text-blue-700', DELIVERED: 'bg-emerald-100 text-emerald-700',
    FAILED: 'bg-red-100 text-red-700', CANCELLED: 'bg-gray-200 text-gray-500',
    ARRIVED: 'bg-cyan-100 text-cyan-700', PARTIAL: 'bg-orange-100 text-orange-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700', FROZEN: 'bg-indigo-100 text-indigo-700',
    ONLINE: 'bg-green-100 text-green-700', OFFLINE: 'bg-gray-200 text-gray-500',
    BUSY: 'bg-red-100 text-red-600', PAUSE: 'bg-yellow-100 text-yellow-700',
    VERIFIED: 'bg-green-100 text-green-700', REJECTED: 'bg-red-100 text-red-600',
    APPROVED: 'bg-green-100 text-green-700', PENDING_ACCESS: 'bg-amber-100 text-amber-700',
    ACCESS_ACCEPTED: 'bg-blue-100 text-blue-700', PENDING_FLEET: 'bg-purple-100 text-purple-700',
    NO_DRIVER_AVAILABLE: 'bg-red-100 text-red-600',
};

function Badge({ status }: { status: string }) {
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors[status] || 'bg-gray-100 text-gray-600'}`}>
            {status}
        </span>
    );
}

// ─── GLASS CARD ───
function Glass({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-xl shadow-black/5 ${className}`}>
            {children}
        </div>
    );
}

// ─── MAIN PAGE ───
export default function Page() {
    const [token, setToken] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('test_lifecycle_token') || '' : '');
    const [view, setView] = useState<View>('driver');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    // Data
    const [userInfo, setUserInfo] = useState<any>(null);
    const [driverProfile, setDriverProfile] = useState<any>(null);
    const [driverCompanies, setDriverCompanies] = useState<any[]>([]);
    const [missions, setMissions] = useState<any[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Persist token
    useEffect(() => {
        if (typeof window !== 'undefined' && token) localStorage.setItem('test_lifecycle_token', token);
    }, [token]);

    // Toast auto-dismiss
    useEffect(() => {
        if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }
    }, [toast]);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type });

    // ─── LOAD DRIVER DATA ───
    const loadDriverData = useCallback(async () => {
        if (!token) return;
        setLoading(true); setError(null);
        try {
            const [me, profile, companies] = await Promise.all([
                api(token, 'GET', '/auth/me'),
                api(token, 'GET', '/driver/me').catch(() => null),
                api(token, 'GET', '/driver/companies').catch(() => []),
            ]);
            setUserInfo(me); setDriverProfile(profile); setDriverCompanies(Array.isArray(companies) ? companies : []);
        } catch (e: any) { setError(e.message); }
        setLoading(false);
    }, [token]);

    // ─── LOAD MISSIONS ───
    const loadMissions = useCallback(async () => {
        if (!token) return;
        setLoading(true); setError(null);
        try {
            const data = await api(token, 'GET', '/missions');
            setMissions(Array.isArray(data) ? data : []);
        } catch (e: any) { setError(e.message); }
        setLoading(false);
    }, [token]);

    // ─── LOAD ORDER DETAIL ───
    const loadOrderDetail = useCallback(async (orderId: string) => {
        if (!token) return;
        setLoading(true); setError(null);
        try {
            const missions = await api(token, 'GET', '/missions');
            const order = (Array.isArray(missions) ? missions : []).find((m: any) => m.id === orderId);
            if (!order) throw new Error('Order not found in missions');
            setSelectedOrder(order);
        } catch (e: any) { setError(e.message); }
        setLoading(false);
    }, [token]);

    // ─── LIFECYCLE ACTIONS ───
    const doAction = async (label: string, method: string, path: string, body?: any) => {
        setActionLoading(path);
        try {
            await api(token, method, path, body);
            showToast(`✅ ${label} — succès`);
            if (selectedOrder) await loadOrderDetail(selectedOrder.id);
            await loadMissions();
        } catch (e: any) { showToast(`❌ ${label} — ${e.message}`, 'error'); }
        setActionLoading(null);
    };

    const doFormAction = async (label: string, path: string, formData: FormData) => {
        setActionLoading(path);
        try {
            await apiForm(token, path, formData);
            showToast(`✅ ${label} — succès`);
            if (selectedOrder) await loadOrderDetail(selectedOrder.id);
            await loadMissions();
        } catch (e: any) { showToast(`❌ ${label} — ${e.message}`, 'error'); }
        setActionLoading(null);
    };

    // Navigate
    const goToOrders = () => { setView('orders'); loadMissions(); };
    const goToDetail = (order: any) => { setSelectedOrder(order); setView('detail'); };
    const goToDriver = () => { setView('driver'); loadDriverData(); };

    // Connect
    const handleConnect = () => { loadDriverData(); goToDriver(); };

    // ─── SOCKET INTEGRATION ───
    useEffect(() => {
        if (!userInfo || !token) return;

        const socket = socketClient.connect();
        const companyId = userInfo.effectiveCompanyId || userInfo.companyId;

        if (companyId) {
            socket.emit('join', `fleet:${companyId}`);
            console.log(`[TEST-LIFECYCLE] Subscribed to fleet:${companyId}`);
        }

        socket.on('route_updated', (payload: any) => {
            console.log('[TEST-LIFECYCLE] Route update received, refreshing data:', payload);
            loadMissions();
            if (selectedOrder && payload.orderId === selectedOrder.id) {
                loadOrderDetail(selectedOrder.id);
            }
        });

        return () => {
            socket.off('route_updated');
        };
    }, [userInfo, token, loadMissions, loadOrderDetail, selectedOrder]);

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
            {/* ─── HEADER ─── */}
            <header className="sticky top-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-b border-white/40 dark:border-slate-700/40 shadow-lg shadow-black/5">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Package size={16} className="text-white" />
                        </div>
                        <h1 className="text-sm font-black text-gray-800 dark:text-white tracking-tight">Lifecycle Tester</h1>
                    </div>

                    {/* Token Input */}
                    <div className="flex-1 flex items-center gap-2 max-w-xl">
                        <div className="relative flex-1">
                            <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="password"
                                value={token}
                                onChange={e => setToken(e.target.value)}
                                placeholder="Bearer token du driver..."
                                className="w-full pl-9 pr-3 py-2 text-xs bg-white/60 dark:bg-slate-800/60 border border-gray-200/60 dark:border-slate-600/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                                onKeyDown={e => e.key === 'Enter' && handleConnect()}
                            />
                        </div>
                        <button onClick={handleConnect} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors">
                            <LogIn size={14} /> Connecter
                        </button>
                    </div>

                    {/* Nav */}
                    <nav className="flex items-center gap-1">
                        {[
                            { id: 'driver' as View, icon: User, label: 'Driver' },
                            { id: 'orders' as View, icon: Package, label: 'Orders' },
                        ].map(({ id, icon: Icon, label }) => (
                            <button
                                key={id}
                                onClick={() => id === 'driver' ? goToDriver() : goToOrders()}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${view === id || (view === 'detail' && id === 'orders')
                                    ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600' : 'text-gray-500 hover:bg-gray-100/60'}`}
                            >
                                <Icon size={14} /> {label}
                            </button>
                        ))}
                    </nav>
                </div>
            </header>

            {/* ─── TOAST ─── */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
                        className={`fixed top-20 right-4 z-[100] px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── ERROR ─── */}
            {error && (
                <div className="max-w-7xl mx-auto px-4 mt-4">
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                        <AlertTriangle size={14} /> {error}
                    </div>
                </div>
            )}

            {/* ─── LOADER ─── */}
            {loading && (
                <div className="flex justify-center py-12">
                    <Loader2 size={32} className="animate-spin text-indigo-400" />
                </div>
            )}

            {/* ─── VIEWS ─── */}
            <main className="flex-1 overflow-y-auto max-w-7xl w-full mx-auto px-4 py-6">
                {!loading && view === 'driver' && <DriverDetailView user={userInfo} profile={driverProfile} companies={driverCompanies} />}
                {!loading && view === 'orders' && <OrdersListView missions={missions} onSelect={goToDetail} onRefresh={loadMissions} onAccept={(id) => doAction('Accept', 'POST', `/missions/${id}/accept`)} onRefuse={(id) => doAction('Refuse', 'POST', `/missions/${id}/refuse`)} actionLoading={actionLoading} />}
                {!loading && view === 'detail' && selectedOrder && <OrderDetailView order={selectedOrder} onBack={goToOrders} onAction={doAction} onFormAction={doFormAction} actionLoading={actionLoading} onRefresh={() => loadOrderDetail(selectedOrder.id)} />}
            </main>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// VIEW 1: DRIVER DETAIL
// ═══════════════════════════════════════════════════════════
function DriverDetailView({ user, profile, companies }: { user: any; profile: any; companies: any[] }) {
    if (!user) return <div className="text-center text-gray-400 py-20 text-sm">Entrez un token et cliquez "Connecter"</div>;

    return (
        <div className="space-y-6">
            {/* User Info */}
            <Glass className="p-6">
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2"><User size={14} /> Utilisateur</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Nom', value: user.fullName || '—' },
                        { label: 'Téléphone', value: user.phone || '—' },
                        { label: 'Email', value: user.email || '—' },
                        { label: 'ID', value: user.id },
                        { label: 'Driver', value: user.isDriver ? '✅ Oui' : '❌ Non' },
                        { label: 'Admin', value: user.isAdmin ? '✅ Oui' : '❌ Non' },
                        { label: 'Company ID', value: user.companyId || '—' },
                        { label: 'Actif', value: user.isActive ? '✅' : '❌' },
                    ].map(({ label, value }) => (
                        <div key={label}>
                            <div className="text-[10px] font-bold text-gray-400 uppercase">{label}</div>
                            <div className="text-sm font-semibold text-gray-800 dark:text-white truncate">{value}</div>
                        </div>
                    ))}
                </div>
            </Glass>

            {/* Driver Setting */}
            {profile && (
                <Glass className="p-6">
                    <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2"><Truck size={14} /> Driver Settings</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Status', value: <Badge status={profile.status || 'OFFLINE'} /> },
                            { label: 'Mode', value: profile.currentMode || '—' },
                            { label: 'Vérification', value: <Badge status={profile.verificationStatus || 'PENDING'} /> },
                            { label: 'Company ID', value: profile.currentCompanyId || '—' },
                            { label: 'Lat', value: profile.currentLat?.toFixed(5) || '—' },
                            { label: 'Lng', value: profile.currentLng?.toFixed(5) || '—' },
                            { label: 'Zone active', value: profile.activeZoneId || '—' },
                            { label: 'Véhicule actif', value: profile.activeVehicleId || '—' },
                            { label: 'Chaînage', value: profile.allowChaining ? '✅' : '❌' },
                            { label: 'Kilométrage', value: `${profile.mileage || 0} km` },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <div className="text-[10px] font-bold text-gray-400 uppercase">{label}</div>
                                <div className="text-sm font-semibold text-gray-800 dark:text-white">{value}</div>
                            </div>
                        ))}
                    </div>
                </Glass>
            )}

            {/* Company Driver Settings */}
            {companies.length > 0 && (
                <Glass className="p-6">
                    <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">🏢 Relations Entreprises ({companies.length})</h2>
                    <div className="space-y-3">
                        {companies.map((c: any) => (
                            <div key={c.id} className="p-4 bg-gray-50/50 dark:bg-slate-800/40 rounded-xl border border-gray-100 dark:border-slate-700/30 flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-bold text-gray-800 dark:text-white">{c.company?.name || c.companyId}</div>
                                    <div className="text-[10px] text-gray-400 mt-0.5">{c.id}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge status={c.status} />
                                    <Badge status={c.docsStatus || 'PENDING'} />
                                </div>
                            </div>
                        ))}
                    </div>
                </Glass>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// VIEW 2: ORDERS LIST
// ═══════════════════════════════════════════════════════════
function OrdersListView({ missions, onSelect, onRefresh, onAccept, onRefuse, actionLoading }: {
    missions: any[]; onSelect: (o: any) => void; onRefresh: () => void;
    onAccept: (id: string) => void; onRefuse: (id: string) => void; actionLoading: string | null;
}) {
    const active = missions.filter(m => m.status === 'ACCEPTED');
    const pending = missions.filter(m => m.status === 'PENDING');
    const history = missions.filter(m => ['DELIVERED', 'FAILED', 'CANCELLED'].includes(m.status));

    const renderSection = (title: string, icon: React.ReactNode, orders: any[], showAcceptRefuse = false) => (
        <Glass className="p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">{icon} {title} ({orders.length})</h2>
            </div>
            {orders.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">Aucune commande</div>
            ) : (
                <div className="space-y-2">
                    {orders.map((o: any) => (
                        <div key={o.id} className="p-4 bg-gray-50/50 dark:bg-slate-800/40 rounded-xl border border-gray-100 dark:border-slate-700/30 hover:border-indigo-200 dark:hover:border-indigo-600/30 transition-colors cursor-pointer group"
                            onClick={() => onSelect(o)}>
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono font-bold text-gray-700 dark:text-white">{o.id}</span>
                                        <Badge status={o.status} />
                                        {o.assignmentMode && <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-bold">{o.assignmentMode}</span>}
                                    </div>
                                    <div className="text-[10px] text-gray-400">
                                        Client: {o.client?.fullName || '—'} • {o.steps?.length || 0} steps • {o.steps?.reduce((n: number, s: any) => n + (s.stops?.length || 0), 0) || 0} stops
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {showAcceptRefuse && (
                                        <>
                                            <button onClick={e => { e.stopPropagation(); onAccept(o.id); }}
                                                disabled={actionLoading !== null}
                                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg transition-colors disabled:opacity-50">
                                                {actionLoading === `/missions/${o.id}/accept` ? <Loader2 size={12} className="animate-spin" /> : '✓ Accepter'}
                                            </button>
                                            <button onClick={e => { e.stopPropagation(); onRefuse(o.id); }}
                                                disabled={actionLoading !== null}
                                                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold rounded-lg transition-colors disabled:opacity-50">
                                                ✕ Refuser
                                            </button>
                                        </>
                                    )}
                                    <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Glass>
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-black text-gray-800 dark:text-white">Missions</h1>
                <button onClick={onRefresh} className="p-2 hover:bg-white/60 rounded-xl transition-colors"><RefreshCw size={16} className="text-gray-400" /></button>
            </div>
            {renderSection('En cours', <Play size={14} className="text-blue-500" />, active)}
            {renderSection('Disponibles', <Clock size={14} className="text-amber-500" />, pending, true)}
            {renderSection('Historique', <Clock size={14} className="text-gray-400" />, history)}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// VIEW 3: ORDER DETAIL + LIFECYCLE
// ═══════════════════════════════════════════════════════════
function OrderDetailView({ order, onBack, onAction, onFormAction, actionLoading, onRefresh }: {
    order: any; onBack: () => void;
    onAction: (label: string, method: string, path: string, body?: any) => void;
    onFormAction: (label: string, path: string, formData: FormData) => void;
    actionLoading: string | null; onRefresh: () => void;
}) {
    const [expandedStops, setExpandedStops] = useState<Set<string>>(new Set());
    const [proofInputs, setProofInputs] = useState<Record<string, string>>({});

    const toggleStop = (id: string) => setExpandedStops(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    // Collect all stops for map
    const allStops = order.steps?.flatMap((step: any) => step.stops || []) || [];
    const stopsWithCoords = allStops.filter((s: any) => s.address?.lat && s.address?.lng);
    const mapCenter = stopsWithCoords.length > 0
        ? { lat: stopsWithCoords[0].address.lat, lng: stopsWithCoords[0].address.lng }
        : { lat: 14.7, lng: -17.47 };

    const isAccepted = order.status === 'ACCEPTED';
    const isPending = order.status === 'PENDING';
    const allActions = allStops.flatMap((s: any) => s.actions || []);
    const allTerminal = allActions.every((a: any) => ['COMPLETED', 'FROZEN', 'CANCELLED', 'FAILED'].includes(a.status));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-2 hover:bg-white/60 rounded-xl transition-colors"><ArrowLeft size={18} className="text-gray-500" /></button>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-black text-gray-800 dark:text-white">{order.id}</span>
                        <Badge status={order.status} />
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">Client: {order.client?.fullName || '—'} • Driver: {order.driverId || 'Non assigné'}</div>
                </div>
                <button onClick={onRefresh} className="p-2 hover:bg-white/60 rounded-xl transition-colors"><RefreshCw size={16} className="text-gray-400" /></button>
            </div>

            {/* Global Actions */}
            <Glass className="p-4 flex flex-wrap gap-2">
                {isPending && (
                    <>
                        <button onClick={() => onAction('Accept', 'POST', `/missions/${order.id}/accept`)}
                            disabled={actionLoading !== null}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50">
                            {actionLoading === `/missions/${order.id}/accept` ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Accepter Mission
                        </button>
                        <button onClick={() => onAction('Refuse', 'POST', `/missions/${order.id}/refuse`)}
                            disabled={actionLoading !== null}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50">
                            <XCircle size={14} /> Refuser Mission
                        </button>
                    </>
                )}
                {isAccepted && allTerminal && (
                    <button onClick={() => onAction('Finish', 'POST', `/missions/${order.id}/finish`)}
                        disabled={actionLoading !== null}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-200/50">
                        {actionLoading === `/missions/${order.id}/finish` ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} 🏁 Terminer Mission
                    </button>
                )}
                {!isPending && !isAccepted && (
                    <div className="text-xs text-gray-400 italic">Mission terminée ({order.status})</div>
                )}
            </Glass>

            {/* Map */}
            {stopsWithCoords.length > 0 && (
                <Glass className="overflow-hidden h-[300px]">
                    <GoogleMap center={mapCenter} zoom={12} className="w-full h-full">
                        {stopsWithCoords.map((stop: any, i: number) => (
                            <Marker key={stop.id} position={{ lat: stop.address.lat, lng: stop.address.lng }}
                                label={`${i + 1}`}
                                icon={{ url: stop.status === 'COMPLETED' ? undefined : undefined }} />
                        ))}
                        {order.routeGeometry?.coordinates && (
                            <Polyline path={order.routeGeometry.coordinates.map(([lng, lat]: number[]) => ({ lat, lng }))}
                                color="#6366f1" width={4} />
                        )}
                    </GoogleMap>
                </Glass>
            )}

            {/* Hierarchical Tree */}
            <Glass className="p-5">
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">📋 Structure de la commande</h2>
                <div className="space-y-4">
                    {(order.steps || []).map((step: any, si: number) => (
                        <div key={step.id} className="border border-gray-100 dark:border-slate-700/30 rounded-xl overflow-hidden">
                            {/* Step Header */}
                            <div className="px-4 py-3 bg-gray-50/50 dark:bg-slate-800/30 flex items-center gap-2">
                                <span className="text-[10px] font-bold text-indigo-500">STEP {si + 1}</span>
                                <span className="text-[10px] font-mono text-gray-400">{step.id}</span>
                                {step.linked && <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 font-bold">LINKED</span>}
                            </div>

                            {/* Stops */}
                            <div className="divide-y divide-gray-100 dark:divide-slate-700/20">
                                {(step.stops || []).map((stop: any, sti: number) => {
                                    const isExpanded = expandedStops.has(stop.id);
                                    const stopActions = stop.actions || [];
                                    const canArrive = isAccepted && stop.status === 'PENDING';
                                    const canFreeze = isAccepted && ['ARRIVED', 'PARTIAL'].includes(stop.status);
                                    const stopAllTerminal = stopActions.every((a: any) => ['COMPLETED', 'FROZEN', 'CANCELLED', 'FAILED'].includes(a.status));
                                    const canComplete = isAccepted && canFreeze && stopAllTerminal;

                                    return (
                                        <div key={stop.id}>
                                            {/* Stop Header */}
                                            <div className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors"
                                                onClick={() => toggleStop(stop.id)}>
                                                {isExpanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                                                <MapPin size={14} className="text-blue-400" />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-gray-700 dark:text-white">Stop {stop.execution_order ?? stop.display_order ?? sti + 1}</span>
                                                        <Badge status={stop.status || 'PENDING'} />
                                                        <span className="text-[10px] font-mono text-gray-400">{stop.id}</span>
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 mt-0.5">
                                                        {stop.address?.formattedAddress || stop.address?.label || '—'} • {stopActions.length} actions
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    {canArrive && (
                                                        <button onClick={e => { e.stopPropagation(); onAction('Arrivé', 'POST', `/stops/${stop.id}/arrival`); }}
                                                            disabled={actionLoading !== null}
                                                            className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-600 text-white text-[10px] font-bold rounded-lg transition-colors disabled:opacity-50">
                                                            {actionLoading === `/stops/${stop.id}/arrival` ? <Loader2 size={10} className="animate-spin" /> : '📍 Arrivé'}
                                                        </button>
                                                    )}
                                                    {['FROZEN', 'PARTIAL', 'COMPLETED', 'FAILED'].includes(stop.status) && (
                                                        <button onClick={e => { e.stopPropagation(); onAction('Réactiver Stop', 'POST', `/stops/${stop.id}/unfreeze`); }}
                                                            disabled={actionLoading !== null}
                                                            className="px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-bold rounded-lg transition-colors disabled:opacity-50">
                                                            <RefreshCw size={10} className="inline mr-0.5" /> Réactiver
                                                        </button>
                                                    )}
                                                    {canFreeze && (
                                                        <button onClick={e => { e.stopPropagation(); onAction('Freeze Stop', 'POST', `/stops/${stop.id}/freeze`, { reason: 'Gelé via test' }); }}
                                                            disabled={actionLoading !== null}
                                                            className="px-2.5 py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-bold rounded-lg transition-colors disabled:opacity-50">
                                                            <Snowflake size={10} className="inline mr-0.5" /> Geler
                                                        </button>
                                                    )}
                                                    {canComplete && (
                                                        <button onClick={e => { e.stopPropagation(); onAction('Complete Stop', 'POST', `/stops/${stop.id}/complete`); }}
                                                            disabled={actionLoading !== null}
                                                            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg transition-colors disabled:opacity-50">
                                                            ✓ Compléter
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions (expanded) */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                                        <div className="px-4 pb-3 space-y-2 ml-8">
                                                            {stopActions.map((action: any) => {
                                                                // IMPORTANT: We allow acting if stop is ARRIVED or PARTIAL (some things frozen/failed) 
                                                                // or even COMPLETED (manually finished but maybe some actions are still PENDING if forced)
                                                                const canAct = isAccepted && ['ARRIVED', 'PARTIAL', 'COMPLETED'].includes(stop.status) && action.status === 'PENDING';
                                                                const canUnfreeze = isAccepted && action.status === 'FROZEN';
                                                                const hasCodeProof = action.confirmationRules?.code?.length > 0;
                                                                const proofKey = `proof_${action.id}`;

                                                                return (
                                                                    <div key={action.id} className="p-3 bg-white/60 dark:bg-slate-800/40 rounded-xl border border-gray-100 dark:border-slate-700/20">
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${action.type === 'PICKUP' ? 'bg-green-100 text-green-600' : action.type === 'DELIVERY' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'}`}>
                                                                                    {action.type === 'PICKUP' ? '⬆ PICKUP' : action.type === 'DELIVERY' ? '⬇ DELIVERY' : '⚙ SERVICE'}
                                                                                </span>
                                                                                <Badge status={action.status} />
                                                                                <span className="text-[10px] font-mono text-gray-400">{action.id}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5">
                                                                                {canUnfreeze && (
                                                                                    <button onClick={() => onAction('Réactiver Action', 'POST', `/actions/${action.id}/unfreeze`)}
                                                                                        disabled={actionLoading !== null}
                                                                                        className="px-2.5 py-1 bg-blue-400 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg transition-colors disabled:opacity-50">
                                                                                        <RefreshCw size={10} className="inline mr-0.5" /> Réactiver
                                                                                    </button>
                                                                                )}
                                                                                {canAct && (
                                                                                    <>
                                                                                        <button onClick={() => {
                                                                                            const proofs: Record<string, string> = {};
                                                                                            if (hasCodeProof && proofInputs[proofKey]) {
                                                                                                action.confirmationRules.code.forEach((c: any) => { proofs[c.name] = proofInputs[proofKey]; });
                                                                                            }
                                                                                            onAction('Complete Action', 'POST', `/actions/${action.id}/complete`, { proofs });
                                                                                        }}
                                                                                            disabled={actionLoading !== null}
                                                                                            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg transition-colors disabled:opacity-50">
                                                                                            {actionLoading === `/actions/${action.id}/complete` ? <Loader2 size={10} className="animate-spin" /> : '✓ Compléter'}
                                                                                        </button>
                                                                                        <button onClick={() => onAction('Freeze Action', 'POST', `/actions/${action.id}/freeze`, { reason: 'Gelé via test' })}
                                                                                            disabled={actionLoading !== null}
                                                                                            className="px-2.5 py-1 bg-indigo-400 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg transition-colors disabled:opacity-50">
                                                                                            <Snowflake size={10} className="inline" />
                                                                                        </button>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        {/* Transit Item */}
                                                                        {action.transitItem && (
                                                                            <div className="mt-2 text-[10px] text-gray-500">
                                                                                📦 {action.transitItem.name} — qty: {action.quantity} {action.transitItem.weight && `• ${action.transitItem.weight}kg`}
                                                                            </div>
                                                                        )}
                                                                        {/* Proof input */}
                                                                        {canAct && hasCodeProof && (
                                                                            <div className="mt-2 flex items-center gap-2">
                                                                                <KeyRound size={12} className="text-gray-400" />
                                                                                <input
                                                                                    type="text" placeholder="Code OTP..."
                                                                                    value={proofInputs[proofKey] || ''}
                                                                                    onChange={e => setProofInputs(p => ({ ...p, [proofKey]: e.target.value }))}
                                                                                    className="flex-1 px-2 py-1 text-[10px] bg-gray-50 dark:bg-slate-700/40 border border-gray-200 dark:border-slate-600 rounded-lg"
                                                                                />
                                                                            </div>
                                                                        )}
                                                                        {/* Status History */}
                                                                        {action.statusHistory?.length > 0 && (
                                                                            <div className="mt-2 space-y-0.5">
                                                                                {action.statusHistory.map((h: any, i: number) => (
                                                                                    <div key={i} className="text-[9px] text-gray-400">
                                                                                        <Badge status={h.status} /> <span className="ml-1">{new Date(h.timestamp).toLocaleString()}</span> {h.note && `— ${h.note}`}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </Glass>

            {/* Status History */}
            {order.statusHistory?.length > 0 && (
                <Glass className="p-5">
                    <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">📜 Historique Statuts Order</h2>
                    <div className="space-y-1.5">
                        {order.statusHistory.map((h: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                                <Badge status={h.status} />
                                <span className="text-gray-500">{new Date(h.timestamp).toLocaleString()}</span>
                                {h.note && <span className="text-gray-400 italic">— {h.note}</span>}
                            </div>
                        ))}
                    </div>
                </Glass>
            )}
        </div>
    );
}
