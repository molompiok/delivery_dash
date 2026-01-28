import React, { useEffect, useState, useRef } from 'react';
import { usePageContext } from 'vike-react/usePageContext';
import { Truck, User as UserIcon, FileText, ArrowLeft, Upload, Paperclip, AlertCircle, MapPin, Package, Edit, Clock, ShieldCheck, Fuel, Battery, RefreshCw, Star, TrendingUp, AlertTriangle, CheckCircle2, Info, Search, ChevronRight } from 'lucide-react';
import { fleetService } from '../../../api/fleet';
import { driverService } from '../../../api/drivers';
import { Vehicle, User, CompanyDriverSetting } from '../../../api/types';
import { VehicleEditModal } from '../../../components/VehicleEditModal';
import { EmptyState } from '../../../components/EmptyState';

const VEHICLE_TYPE_LABELS: Record<string, string> = {
    'MOTO': 'Moto',
    'CAR_SEDAN': 'Voiture',
    'VAN': 'Utilitaire',
    'TRUCK': 'Poids Lourd',
    'BICYCLE': 'Vélo'
};

const ENERGY_LABELS: Record<string, string> = {
    'GASOLINE': 'Essence',
    'DIESEL': 'Diesel',
    'ELECTRIC': 'Électrique',
    'HYBRID': 'Hybride',
    '': 'Inconnu'
};

// --- PREMIUM MOCKS ---
const MOCKED_TELEMETRY = {
    healthScore: 94,
    batteryLevel: 88,
    fuelRange: '420 km',
    lastSync: 'Il y a 2 min',
    engineStatus: 'Optimal',
    tirePressure: 'Normal',
    oilLife: '75%',
    avgConsumption: '6.2L/100km'
};

const MOCKED_MAINTENANCE = [
    { title: 'Vidange moteur', date: '12 Jan 2024', odometer: '42,500 km', cost: '45,000 FCFA', type: 'ROUTINE' },
    { title: 'Changement pneumatiques', date: '05 Nov 2023', odometer: '38,200 km', cost: '120,000 FCFA', type: 'REPAIR' },
    { title: 'Révision climatisation', date: '15 Sep 2023', odometer: '35,000 km', cost: '25,000 FCFA', type: 'ROUTINE' }
];

export default function Page() {
    const pageContext = usePageContext();
    const vehicleId = pageContext.routeParams?.id;
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [drivers, setDrivers] = useState<CompanyDriverSetting[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'DETAILS' | 'FILES' | 'DRIVER' | 'ORDERS'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('vehicle_detail_tab') as any) || 'DETAILS';
        }
        return 'DETAILS';
    });

    const handleTabChange = (tab: typeof activeTab) => {
        setActiveTab(tab);
        localStorage.setItem('vehicle_detail_tab', tab);
    };
    const [error, setError] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // File Upload State
    const [isUploading, setIsUploading] = useState(false);
    const [docType, setDocType] = useState('VEHICLE_INSURANCE');
    const [expiryDate, setExpiryDate] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, [vehicleId]);

    useEffect(() => {
        if (activeTab === 'ORDERS' && !orders.length) {
            loadOrders();
        }
    }, [activeTab]);

    const loadData = async () => {
        try {
            const [vehicleRes, driversRes] = await Promise.all([
                fleetService.getVehicle(vehicleId),
                driverService.listDrivers()
            ]);
            setVehicle(vehicleRes.data);
            setDrivers(driversRes.data);
        } catch (err) {
            console.error(err);
            setError('Impossible de charger les données du véhicule.');
        } finally {
            setIsLoading(false);
        }
    };

    const loadOrders = async () => {
        try {
            const res = await fleetService.getVehicleOrders(vehicleId);
            setOrders(res.data);
        } catch (err) {
            console.error("Failed to load orders", err);
        }
    }

    const handleAssignDriver = async (driverId: string | null) => {
        try {
            await fleetService.assignDriver(vehicleId, driverId);
            loadData(); // Refresh
        } catch (err: any) {
            alert(err.message || 'Erreur lors de l\'assignation');
        }
    };

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fileInputRef.current?.files?.[0]) return;

        setIsUploading(true);
        try {
            const file = fileInputRef.current.files[0];
            await fleetService.uploadDocument(vehicleId, docType, file, expiryDate);

            // Reset form
            if (fileInputRef.current) fileInputRef.current.value = '';
            setExpiryDate('');

            // Refresh data
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erreur upload');
        } finally {
            setIsUploading(false);
        }
    };

    // Note: Replace and Delete functionality needs reimplementation with new FileManager API
    // For now, users need to upload new documents which will replace existing ones

    if (isLoading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;
    if (!vehicle) return <div className="p-8 text-center text-red-500">{error || 'Véhicule introuvable'}</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-5">
                    <button onClick={() => window.location.href = '/fleet'} className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-sm transition-all text-slate-600">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">{vehicle.brand} {vehicle.model}</h1>
                            <span className="font-mono text-sm font-bold bg-slate-900 text-white px-3 py-1 rounded-lg border border-slate-800 shadow-lg">
                                {vehicle.plate}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black border transition-colors ${vehicle.verificationStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                vehicle.verificationStatus === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${vehicle.verificationStatus === 'APPROVED' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                {vehicle.verificationStatus}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                                {VEHICLE_TYPE_LABELS[vehicle.type] || vehicle.type}
                                <span className="mx-2 opacity-30">•</span>
                                {ENERGY_LABELS[vehicle.energy] || vehicle.energy || 'Non spécifié'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="px-6 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
                    >
                        <Edit size={16} />
                        <span>Configuration</span>
                    </button>
                    <a
                        href={`/map?vehicle_id=${vehicle.id}`}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                    >
                        <MapPin size={16} />
                        <span>Live Tracking</span>
                    </a>
                </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Health Score', value: `${MOCKED_TELEMETRY.healthScore}%`, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Autonomie', value: MOCKED_TELEMETRY.fuelRange, icon: Fuel, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'Batterie', value: `${MOCKED_TELEMETRY.batteryLevel}%`, icon: Battery, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Dernière Sync', value: MOCKED_TELEMETRY.lastSync, icon: RefreshCw, color: 'text-slate-500', bg: 'bg-slate-50' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-4">
                        <div className={`p-2.5 ${stat.bg} ${stat.color} rounded-2xl`}>
                            <stat.icon size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-lg font-black text-slate-900 leading-none mt-1">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[500px]">
                <div className="flex border-b border-gray-200 overflow-x-auto">
                    {[
                        { id: 'DETAILS', label: 'Informations', icon: FileText },
                        { id: 'DRIVER', label: `Chauffeur (${vehicle.assignedDriver ? '1' : '0'})`, icon: UserIcon },
                        { id: 'ORDERS', label: 'Commandes', icon: Package },
                        { id: 'FILES', label: `Documents (${(vehicle.vehicleInsurance?.length || 0) + (vehicle.vehicleTechnicalVisit?.length || 0) + (vehicle.vehicleRegistration?.length || 0)})`, icon: Paperclip },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id as any)}
                            className={`flex items-center px-6 py-4 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id
                                ? 'border-emerald-500 text-emerald-600 bg-emerald-50/30'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <tab.icon size={16} className="mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {/* DETAILS TAB */}
                    {activeTab === 'DETAILS' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {/* Top row: Gauges & Status */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 flex flex-col items-center text-center">
                                    <div className="relative w-32 h-32 mb-4">
                                        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                                            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="282.7" strokeDashoffset={282.7 - (282.7 * ((vehicle as any).telemetry?.fuelLevel || 0)) / 100} className={(vehicle as any).telemetry?.fuelLevel < 20 ? 'text-rose-500' : 'text-emerald-500'} />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-2xl font-black text-slate-900 leading-none">{(vehicle as any).telemetry?.fuelLevel || 0}%</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Carburant</span>
                                        </div>
                                    </div>
                                    <p className="text-xs font-bold text-slate-500 italic">Autonomie estimée : {MOCKED_TELEMETRY.fuelRange}</p>
                                </div>

                                <div className="md:col-span-2 bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <ShieldCheck size={14} className="text-indigo-600" /> État de Santé du Système
                                    </h3>
                                    <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                                        {[
                                            { label: 'Moteur', value: MOCKED_TELEMETRY.engineStatus, icon: CheckCircle2, color: 'text-emerald-500' },
                                            { label: 'Pneus', value: MOCKED_TELEMETRY.tirePressure, icon: CheckCircle2, color: 'text-emerald-500' },
                                            { label: 'Huile', value: MOCKED_TELEMETRY.oilLife, icon: CheckCircle2, color: 'text-emerald-500' },
                                            { label: 'Conso Moy.', value: MOCKED_TELEMETRY.avgConsumption, icon: TrendingUp, color: 'text-indigo-500' }
                                        ].map((diag, i) => (
                                            <div key={i} className="flex items-center gap-4">
                                                <div className={`p-2 rounded-xl bg-white shadow-sm ${diag.color}`}>
                                                    <diag.icon size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">{diag.label}</p>
                                                    <p className="text-sm font-black text-slate-900 mt-1">{diag.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom row: Characteristics & Specs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                <div>
                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                                        <Info size={14} className="text-indigo-600" /> Spécifications Techniques
                                    </h3>
                                    <dl className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-slate-50/50 rounded-2xl">
                                            <dt className="text-[10px] font-bold text-slate-400 uppercase">Poids Max</dt>
                                            <dd className="text-sm font-black text-slate-900 mt-0.5">{vehicle.specs?.maxWeight ? `${vehicle.specs.maxWeight} kg` : '-'}</dd>
                                        </div>
                                        <div className="p-3 bg-slate-50/50 rounded-2xl">
                                            <dt className="text-[10px] font-bold text-slate-400 uppercase">Cargo Volume</dt>
                                            <dd className="text-sm font-black text-slate-900 mt-0.5">{vehicle.specs?.cargoVolume ? `${vehicle.specs.cargoVolume} m³` : '-'}</dd>
                                        </div>
                                        <div className="p-3 bg-slate-50/50 rounded-2xl">
                                            <dt className="text-[10px] font-bold text-slate-400 uppercase">Énergie</dt>
                                            <dd className="text-sm font-black text-slate-900 mt-0.5">{ENERGY_LABELS[vehicle.energy] || vehicle.energy}</dd>
                                        </div>
                                        <div className="p-3 bg-slate-50/50 rounded-2xl">
                                            <dt className="text-[10px] font-bold text-slate-400 uppercase">Odomètre</dt>
                                            <dd className="text-sm font-black text-slate-900 mt-0.5">{(vehicle as any).telemetry?.mileage?.toLocaleString() || '0'} km</dd>
                                        </div>
                                    </dl>
                                </div>
                                <div className="bg-indigo-900 text-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
                                        <Truck size={120} />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em] mb-4">Prochaine Maintenance</p>
                                        <p className="text-3xl font-black mb-2">{(vehicle as any).telemetry?.nextMaintenance || '15 Mars 2024'}</p>
                                        <p className="text-sm opacity-80 flex items-center gap-2">
                                            <Clock size={16} /> Estimation dans 1,200 km
                                        </p>
                                        <button className="mt-8 px-6 py-2 bg-white text-indigo-900 rounded-xl font-bold text-xs hover:bg-slate-100 transition-all">
                                            Planifier maintenant
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DRIVER TAB */}
                    {activeTab === 'DRIVER' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 text-center relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-10"></div>
                                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 shadow-xl border-4 border-white relative z-10">
                                        {vehicle.assignedDriver ? (
                                            <span className="text-4xl font-black tracking-tighter">{(vehicle.assignedDriver.fullName || '?').split(' ').map(n => n[0]).join('')}</span>
                                        ) : (
                                            <UserIcon size={48} />
                                        )}
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 leading-tight">
                                        {vehicle.assignedDriver ? vehicle.assignedDriver.fullName : 'SANS CHAUFFEUR'}
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                        {vehicle.assignedDriver ? vehicle.assignedDriver.phone : 'Véhicule en attente d\'attribution'}
                                    </p>

                                    {vehicle.assignedDriver && (
                                        <div className="mt-8 pt-8 border-t border-slate-50 grid grid-cols-2 gap-4">
                                            <div className="text-center">
                                                <p className="text-[10px] font-black text-slate-400 uppercase">Missions</p>
                                                <p className="text-lg font-black text-indigo-600 mt-1">128</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-black text-slate-400 uppercase">Note</p>
                                                <div className="flex items-center justify-center gap-1 text-amber-500 font-black text-lg mt-1">
                                                    4.9 <Star size={14} fill="currentColor" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">Attribuer un nouveau chauffeur</label>
                                    <div className="flex gap-2">
                                        <select
                                            className="block w-full rounded-2xl border-slate-100 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm p-3 bg-white border outline-none font-bold text-slate-700"
                                            value={vehicle.assignedDriverId || ''}
                                            onChange={(e) => handleAssignDriver(e.target.value || null)}
                                        >
                                            <option value="">-- Sélectionner --</option>
                                            {drivers.map((item: any) => {
                                                const driver = item.driver || item;
                                                return (
                                                    <option key={driver.id} value={driver.id}>
                                                        {driver.fullName}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-2">
                                <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center">
                                    <Clock size={16} className="mr-2 text-indigo-600" /> Journal d'Activités d'Assignation
                                </h3>
                                <div className="space-y-4">
                                    {vehicle.metadata?.assignmentHistory && vehicle.metadata.assignmentHistory.length > 0 ? (
                                        [...vehicle.metadata.assignmentHistory].reverse().map((entry, idx) => (
                                            <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-50 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${entry.action === 'ASSIGNED' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                        {entry.action === 'ASSIGNED' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">
                                                            {entry.action === 'ASSIGNED' ? 'Attribution réussie' : 'Désattribution effectuée'}
                                                        </p>
                                                        <p className="text-xs text-slate-400 font-bold mt-0.5">
                                                            Chauffeur : <span className="text-indigo-600">{entry.driverName}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-slate-300 uppercase leading-none">
                                                        {new Date(entry.timestamp).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-xs font-bold text-slate-900 mt-1">
                                                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                            <p className="text-sm text-slate-400 font-bold italic uppercase tracking-widest">Historique Vierge</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ORDERS TAB */}
                    {activeTab === 'ORDERS' && (
                        <div className="animate-in fade-in duration-300">
                            {orders.length === 0 ? (
                                <EmptyState
                                    icon={Package}
                                    title="Aucune course"
                                    description="Aucune course n'a encore été effectuée avec ce véhicule."
                                />
                            ) : (
                                <div className="overflow-hidden border border-slate-100 rounded-3xl shadow-xl shadow-slate-200/50 bg-white">
                                    <table className="min-w-full divide-y divide-slate-50">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                                <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Référence</th>
                                                <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Chauffeur</th>
                                                <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Trajet</th>
                                                <th scope="col" className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {orders.map((order) => (
                                                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <p className="text-xs font-black text-slate-700">{new Date(order.createdAt).toLocaleDateString()}</p>
                                                        <p className="text-[10px] font-bold text-slate-400">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-xs font-black text-indigo-600 uppercase italic">
                                                        #{order.id.substring(order.id.length - 6)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-700">
                                                        {order.driver ? order.driver.fullName : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="truncate max-w-[200px] font-bold text-slate-700" title={order.pickupAddress?.formattedAddress}>{order.pickupAddress?.formattedAddress || 'N/A'}</span>
                                                            <span className="truncate max-w-[200px]" title={order.deliveryAddress?.formattedAddress}>{order.deliveryAddress?.formattedAddress || 'N/A'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black italic uppercase ${order.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                            order.status === 'CANCELLED' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                                'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* FILES TAB */}
                    {activeTab === 'FILES' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {/* Upload Vault */}
                            <div className="bg-indigo-50/50 rounded-[2rem] p-8 border border-indigo-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <ShieldCheck size={120} />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                                        <Upload className="text-indigo-600" /> Document Vault
                                        <span className="text-xs font-bold bg-white px-3 py-1 rounded-full text-indigo-600 shadow-sm">Audit Ready</span>
                                    </h3>
                                    <form onSubmit={handleFileUpload} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Type de Document</label>
                                            <select
                                                value={docType}
                                                onChange={(e) => setDocType(e.target.value)}
                                                className="block w-full rounded-xl border-slate-200 shadow-sm focus:ring-4 focus:ring-indigo-500/10 text-xs p-3.5 bg-white border font-bold text-slate-700 outline-none"
                                            >
                                                <option value="VEHICLE_INSURANCE">📑 Assurance (RC)</option>
                                                <option value="VEHICLE_TECHNICAL_VISIT">🔍 Visite Technique</option>
                                                <option value="VEHICLE_REGISTRATION">🚗 Carte Grise</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sélectionner Fichier</label>
                                            <div className="relative group/file">
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                />
                                                <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-xs font-bold text-slate-500 flex items-center justify-between group-hover/file:border-indigo-300 transition-colors">
                                                    <span className="truncate">Choisir un document...</span>
                                                    <Paperclip size={14} className="text-slate-300" />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Expiration</label>
                                            <input
                                                type="date"
                                                value={expiryDate}
                                                onChange={(e) => setExpiryDate(e.target.value)}
                                                className="block w-full rounded-xl border-slate-200 shadow-sm focus:ring-4 focus:ring-indigo-500/10 text-xs p-3.5 bg-white border font-bold text-slate-700 outline-none"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isUploading}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                                        >
                                            {isUploading ? 'TRANSFERT...' : 'DÉPOSER'}
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Digital Vault Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { title: "Assurance Automobile", key: "insurance", files: vehicle.vehicleInsurance || [], icon: ShieldCheck, color: "text-emerald-500" },
                                    { title: "Visite Technique", key: "technical", files: vehicle.vehicleTechnicalVisit || [], icon: Search, color: "text-amber-500" },
                                    { title: "Carte Grise", key: "registration", files: vehicle.vehicleRegistration || [], icon: FileText, color: "text-blue-500" }
                                ].map((folder, i) => (
                                    <div key={i} className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 flex flex-col h-full">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className={`p-3 rounded-2xl bg-slate-50 ${folder.color}`}>
                                                <folder.icon size={24} />
                                            </div>
                                            <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase">
                                                {folder.files.length} FICHIER(S)
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-black text-slate-900 mb-4">{folder.title}</h4>
                                        <div className="flex-1 space-y-2">
                                            {folder.files.length > 0 ? (
                                                folder.files.map((file, idx) => (
                                                    <div key={idx} className="group flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-sm">
                                                                <FileText size={16} />
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-600 truncate max-w-[120px]">{file.split('/').pop()}</span>
                                                        </div>
                                                        <button
                                                            onClick={async () => {
                                                                const url = await fleetService.getSignedUrl(file);
                                                                window.open(url, '_blank');
                                                            }}
                                                            className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"
                                                        >
                                                            <ChevronRight size={18} />
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-50 rounded-2xl">
                                                    <Paperclip className="text-slate-200 mb-2" size={20} />
                                                    <p className="text-[10px] font-bold text-slate-300 uppercase italic">Aucun document</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div >

            {/* Modals */}
            {
                isEditModalOpen && vehicle && (
                    <VehicleEditModal
                        vehicle={vehicle}
                        onClose={() => setIsEditModalOpen(false)}
                        onUpdate={(updated) => setVehicle(updated)}
                    />
                )
            }
        </div >
    );
}

function DetailRow({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
            <span className="text-sm text-gray-500 font-medium">{label}</span>
            <span className="text-sm font-semibold text-gray-900 text-right">{value}</span>
        </div>
    );
}

/**
 * Simple document section component for displaying documents by category
 */
function DocumentSection({ title, files, onView }: { title: string, files: string[], onView: (filename: string) => void }) {
    if (!files.length) return null;

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                <FileText size={14} className="mr-2" />
                {title}
            </h4>
            <div className="space-y-2">
                {files.map((filename, idx) => {
                    const displayName = filename.split('/').pop() || filename;
                    return (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <span className="text-sm text-gray-700 truncate max-w-[300px]" title={displayName}>
                                {displayName}
                            </span>
                            <button
                                onClick={() => onView(filename)}
                                className="text-emerald-600 hover:text-emerald-700 text-xs font-bold px-3 py-1 rounded-md hover:bg-emerald-50 transition-colors"
                            >
                                Voir
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
