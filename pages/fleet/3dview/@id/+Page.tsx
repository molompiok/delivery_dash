import React, { useState, useEffect, Suspense, useRef } from 'react';
import { usePageContext } from 'vike-react/usePageContext';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Grid, Float } from '@react-three/drei';
import {
    Activity,
    Map as MapIcon,
    History,
    User,
    Truck,
    ChevronRight,
    ChevronLeft,
    Bluetooth,
    Wifi,
    Battery,
    Thermometer,
    Gauge,
    Camera,
    Info,
    LayoutGrid,
    Search,
    Settings,
    Maximize2,
    FileText,
    Upload,
    Fuel,
    Paperclip,
    ShieldCheck,
    RefreshCw,
    Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Vehicle3DModel } from './components/Vehicle3DModel';
import { useHeader } from '../../../../context/HeaderContext';
import { MapLibre as GoogleMap, Marker } from '../../../../components/MapLibre';
import { fleetService } from '../../../../api/fleet';
import { authService } from '../../../../api/auth';
import { Vehicle } from '../../../../api/types';





const WHITE_MAP_STYLE = [
    { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
    { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
    { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
    { "featureType": "landscape.natural", "stylers": [{ "visibility": "off" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "road.arterial", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
    { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#dadada" }] },
    { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
    { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
    { "featureType": "transit.line", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] },
    { "featureType": "transit.station", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c9c9c9" }] },
    { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] }
];

export default function Page() {
    const pageContext = usePageContext();
    const { id } = pageContext.routeParams;
    const { setHeaderContent } = useHeader();

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
    const [activeView, setActiveView] = useState<'external' | 'internal'>('external');
    const [activeTab, setActiveTab] = useState<'STATUS' | 'DOCUMENTS' | 'HISTORY' | 'DRIVER'>('STATUS');
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Mapping backend types to 3D models
    const getModelType = (vt: string) => {
        const t = vt?.toUpperCase();
        if (t === 'VAN' || t === 'TRUCK') return 'conteneur';
        if (t === 'BUS') return 'bus';
        if (t === 'TANKER') return 'citerne';
        return 'conteneur'; // Default
    };

    // Transform backend vehicle to HUD format
    const transformVehicle = (v: Vehicle) => ({
        ...v,
        name: `${v.brand} ${v.model}`,
        type: getModelType(v.type),
        status: v.verificationStatus === 'APPROVED' ? 'En ligne' : 'Inactif',
        driverName: v.assignedDriver?.fullName || 'Non assigné',
        burden: v.specs?.maxWeight ? `${v.specs.maxWeight} kg` : 'N/A',
        volume: v.specs?.cargoVolume ? `${v.specs.cargoVolume} m³` : 'N/A',
        capacity: 0,
        fuel: 100,
        temp: 20,
        avatar: v.assignedDriver?.fullName?.split(' ').map(n => n[0]).join('') || '?',
        filling: 0
    });

    useEffect(() => {
        const fetchFleet = async () => {
            try {
                const userStr = localStorage.getItem('delivery_user');
                let companyId = '';
                if (userStr) {
                    companyId = JSON.parse(userStr).companyId;
                } else {
                    const profile = await authService.getProfile();
                    companyId = profile.data.companyId || '';
                }

                if (companyId) {
                    const res = await fleetService.listVehicles(companyId);
                    setVehicles(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch fleet:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFleet();
    }, []);

    useEffect(() => {
        if (vehicles.length > 0) {
            const found = vehicles.find(v => v.id === id);
            if (found) {
                setSelectedVehicle(transformVehicle(found));
            } else if (!selectedVehicle) {
                setSelectedVehicle(transformVehicle(vehicles[0]));
            }
        }
    }, [id, vehicles]);

    const loadOrders = async (vhcId: string) => {
        try {
            const res = await fleetService.getVehicleOrders(vhcId);
            setOrders(res.data);
        } catch (err) {
            console.error("Failed to load orders", err);
        }
    };

    const handleFileUpload = async (docType: string) => {
        if (!fileInputRef.current?.files?.[0] || !selectedVehicle) return;
        setIsUploading(true);
        try {
            const file = fileInputRef.current.files[0];
            await fleetService.uploadDocument(selectedVehicle.id, docType, file);
            // Refresh current vehicle
            const res = await fleetService.getVehicle(selectedVehicle.id);
            const updated = transformVehicle(res.data);
            setSelectedVehicle(updated);
            setVehicles(prev => prev.map(v => v.id === updated.id ? res.data : v));
        } catch (err) {
            console.error("Upload failed", err);
        } finally {
            setIsUploading(false);
        }
    };

    useEffect(() => {
        if (selectedVehicle?.id) {
            loadOrders(selectedVehicle.id);
        }
    }, [selectedVehicle?.id]);

    useEffect(() => {
        const GLOBAL_STATS = [
            { label: 'Active vehicles', value: 56, color: 'emerald' },
            { label: 'Vehicles in Maintenance', value: 8, color: 'rose' },
            { label: 'Average efficiency', value: '87%', color: 'blue' },
            { label: 'Cargo in transit', value: 128, color: 'amber' },
        ];

        setHeaderContent(
            <div className="flex items-center gap-6 px-6 py-1.5 bg-white/50 backdrop-blur-md rounded-xl border border-white/40 shadow-sm">
                {GLOBAL_STATS.map((stat, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                        <div className={`w-1 h-1 rounded-full ${stat.color === 'emerald' ? 'bg-emerald-500' : stat.color === 'rose' ? 'bg-rose-500' : stat.color === 'blue' ? 'bg-blue-500' : 'bg-amber-500'}`} />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 leading-none">{stat.label}</span>
                            <span className="text-lg font-black text-slate-800 leading-tight">{stat.value}</span>
                        </div>
                    </div>
                ))}
            </div>
        );
        return () => setHeaderContent(null);
    }, [setHeaderContent]);

    if (loading || !selectedVehicle) {
        return (
            <div className="flex items-center justify-center w-full h-full bg-slate-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Initialisation de la flotte...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 w-full h-full bg-[#f0f2f5] text-slate-900 font-sans overflow-hidden relative">

            {/* Main Content Area: 3D Background + HUD Overlay */}
            <div className="flex-1 relative overflow-hidden min-h-0 bg-slate-50">
                {/* 3D Background Layer */}
                <div className="absolute inset-0 z-0">
                    <Canvas shadows gl={{ antialias: true }} camera={{ position: [5, 2, 5], fov: 50 }}>
                        <color attach="background" args={['#ffffff']} />
                        <Suspense fallback={null}>
                            <PerspectiveCamera makeDefault position={[5, 2, 5]} fov={50} />
                            <OrbitControls enablePan={false} minDistance={3} maxDistance={12} makeDefault />
                            <ambientLight intensity={0.7} />
                            <pointLight position={[10, 10, 10]} intensity={1} />
                            <directionalLight position={[-5, 5, 5]} intensity={1} castShadow shadow-mapSize={[1024, 1024]} />
                            <hemisphereLight intensity={0.5} groundColor="#f0f2f5" />
                            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
                                <Vehicle3DModel type={selectedVehicle.type as any} data={selectedVehicle} viewMode={activeView} />
                            </Float>
                        </Suspense>
                    </Canvas>
                </div>

                {/* HUD Overlay Layer */}
                <div className="absolute inset-0 z-10 flex gap-3 p-2 pointer-events-none">
                    {/* Left & Center Section (HUD Rows) */}
                    <div className="flex-1 flex flex-col gap-4 min-w-0">
                        {/* Top Row: Details */}
                        <div className="flex-1 flex gap-4 min-h-0">
                            {/* Left HUD Panel */}
                            <div className="w-[400px] flex flex-col gap-4 pointer-events-none h-full ml-4 mt-2 pb-2">
                                {/* Tab Switcher */}
                                <div className="bg-white/90 backdrop-blur-md rounded-[24px] p-2 shadow-xl border border-white flex gap-1 pointer-events-auto shrink-0 overflow-x-auto scrollbar-none">
                                    {[
                                        { id: 'STATUS', icon: Activity, label: 'Stats' },
                                        { id: 'DOCUMENTS', icon: FileText, label: 'Docs' },
                                        { id: 'HISTORY', icon: History, label: 'Orders' },
                                        { id: 'DRIVER', icon: User, label: 'Driver' }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                                        >
                                            <tab.icon size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="flex-1 flex flex-col min-h-0 pointer-events-auto overflow-y-auto scrollbar-thin">
                                    <AnimatePresence mode="wait">
                                        {activeTab === 'STATUS' && (
                                            <motion.div
                                                key="status"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.2 }}
                                                className="space-y-5 flex flex-col shrink-0"
                                            >
                                                {/* Vehicle Info Card */}
                                                <div className="bg-white/95 backdrop-blur-md rounded-[24px] p-4 shadow-2xl border border-white relative overflow-hidden shrink-0">
                                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                                        <Truck size={80} />
                                                    </div>
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 shadow-inner">
                                                            <Truck size={32} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h2 className="text-xl font-black text-slate-800 leading-none">{selectedVehicle.name}</h2>
                                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black rounded-md uppercase tracking-widest border border-blue-100">Live</span>
                                                            </div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{selectedVehicle.plate}</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <StatLabel label="Burden" value={selectedVehicle.burden} />
                                                        <StatLabel label="Volume" value={selectedVehicle.volume} />
                                                    </div>

                                                    <div className="mt-6">
                                                        <div className="flex justify-between items-center mb-1.5">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Used capacity</span>
                                                            <span className="text-[10px] font-black text-slate-800 tabular-nums">{selectedVehicle.capacity}%</span>
                                                        </div>
                                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${selectedVehicle.capacity}%` }} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Telemetry Grid */}
                                                <div className="grid grid-cols-2 gap-3 pointer-events-auto shrink-0 pb-2">
                                                    <TelemetryCard label="Fuel" value={`${selectedVehicle.fuel}%`} icon={Fuel} />
                                                    <TelemetryCard label="Inside temp" value={`${selectedVehicle.temp}°C`} icon={Thermometer} />
                                                    <TelemetryCard label="Engine" value="88°C" icon={Gauge} />
                                                    <TelemetryCard label="Battery" value="94%" icon={Battery} />
                                                </div>
                                            </motion.div>
                                        )}

                                        {activeTab === 'DOCUMENTS' && (
                                            <motion.div
                                                key="documents"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="bg-white/95 backdrop-blur-md rounded-[24px] p-4 shadow-2xl border border-white flex flex-col pointer-events-auto mb-2"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                                        <FileText className="text-blue-600" /> Documents
                                                    </h2>
                                                    <div className="relative group">
                                                        <input
                                                            type="file"
                                                            ref={fileInputRef}
                                                            onChange={() => handleFileUpload('VEHICLE_INSURANCE')} // Default to insurance for quick test
                                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                        />
                                                        <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100">
                                                            <Upload size={12} /> Upload
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 pr-1">
                                                    {[
                                                        { type: 'VEHICLE_INSURANCE', label: 'Assurance (RC)', files: selectedVehicle.vehicleInsurance || [] },
                                                        { type: 'VEHICLE_TECHNICAL_VISIT', label: 'Visite Technique', files: selectedVehicle.vehicleTechnicalVisit || [] },
                                                        { type: 'VEHICLE_REGISTRATION', label: 'Carte Grise', files: selectedVehicle.vehicleRegistration || [] },
                                                    ].map(doc => (
                                                        <div key={doc.type} className="bg-slate-50/50 border border-slate-100 rounded-xl p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{doc.label}</span>
                                                                <span className="text-[9px] font-bold bg-white px-2 py-0.5 rounded-full text-slate-500 shadow-sm border border-slate-50">{doc.files.length}</span>
                                                            </div>

                                                            {doc.files.length > 0 ? (
                                                                <div className="space-y-2">
                                                                    {doc.files.map((file: string, idx: number) => (
                                                                        <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100 shadow-sm group">
                                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                                <FileText size={14} className="text-blue-500" />
                                                                                <span className="text-[10px] font-bold text-slate-600 truncate">{file.split('/').pop()}</span>
                                                                            </div>
                                                                            <button
                                                                                onClick={async () => {
                                                                                    const url = await fleetService.getSignedUrl(file);
                                                                                    window.open(url, '_blank');
                                                                                }}
                                                                                className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                                                                            >
                                                                                <Maximize2 size={12} />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="text-center py-4 border-2 border-dashed border-slate-100 rounded-xl">
                                                                    <p className="text-[9px] font-bold text-slate-300 uppercase italic">Aucun document</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}

                                        {activeTab === 'HISTORY' && (
                                            <motion.div
                                                key="history"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="bg-white/95 backdrop-blur-md rounded-[24px] p-4 shadow-2xl border border-white flex flex-col pointer-events-auto mb-2"
                                            >
                                                <h2 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
                                                    <History className="text-blue-600" /> Commandes
                                                </h2>
                                                <div className="space-y-3 pr-1">
                                                    {orders.length > 0 ? orders.map(order => (
                                                        <div key={order.id} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-3.5 hover:bg-white hover:shadow-lg transition-all group">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="text-[10px] font-black text-blue-600 uppercase italic">#{order.id.slice(-6)}</span>
                                                                <span className="text-[9px] font-bold text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                            <div className="flex flex-col gap-1.5 mb-2">
                                                                <p className="text-[11px] font-bold text-slate-800 truncate" title={order.pickupAddress?.formattedAddress}>
                                                                    <span className="text-emerald-500 mr-2 inline-block w-1.5 h-1.5 rounded-full bg-current" />
                                                                    {order.pickupAddress?.formattedAddress}
                                                                </p>
                                                                <p className="text-[11px] font-bold text-slate-400 truncate" title={order.deliveryAddress?.formattedAddress}>
                                                                    <span className="text-slate-300 mr-2 inline-block w-1.5 h-1.5 rounded-full bg-current" />
                                                                    {order.deliveryAddress?.formattedAddress}
                                                                </p>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-[9px] font-black bg-white px-2 py-0.5 rounded-md text-slate-600 border border-slate-50 uppercase tracking-tighter">{order.status}</span>
                                                                <span className="text-[11px] font-black text-slate-800 italic">{order.pricingData?.finalPrice || 0} FCFA</span>
                                                            </div>
                                                        </div>
                                                    )) : (
                                                        <div className="h-full flex flex-col items-center justify-center opacity-30 italic py-10">
                                                            <Package size={48} className="mb-2" />
                                                            <p className="text-xs font-bold uppercase tracking-widest">Aucune commande</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}

                                        {activeTab === 'DRIVER' && (
                                            <motion.div
                                                key="driver"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="bg-white/95 backdrop-blur-md rounded-[24px] p-5 shadow-2xl border border-white flex flex-col pointer-events-auto mb-2"
                                            >
                                                <h2 className="text-lg font-black text-slate-800 mb-4 uppercase tracking-widest italic">Driver profile</h2>

                                                {selectedVehicle.assignedDriver ? (
                                                    <div className="flex flex-col items-center text-center">
                                                        <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white text-5xl font-black shadow-2xl mb-6 border-8 border-white">
                                                            {selectedVehicle.avatar}
                                                        </div>
                                                        <h3 className="text-2xl font-black text-slate-800 leading-tight mb-2">{selectedVehicle.driverName}</h3>
                                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">{selectedVehicle.assignedDriver.phone || '+225 07 00 00 00 00'}</p>

                                                        <div className="w-full grid grid-cols-2 gap-4">
                                                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                                                <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">XP Points</span>
                                                                <span className="text-xl font-black text-slate-800 tabular-nums">2,450</span>
                                                            </div>
                                                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                                                <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Status</span>
                                                                <span className="text-xl font-black text-emerald-600 italic">Active</span>
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={() => window.location.href = `/validation/drivers/${selectedVehicle.assignedDriverId}`}
                                                            className="w-full mt-8 py-4 bg-slate-900 text-white rounded-[20px] text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 group"
                                                        >
                                                            Full details <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                                                        <User size={64} className="mb-4 opacity-50" />
                                                        <p className="font-bold italic">No driver assigned</p>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row: Map, Stats & Camera */}
                        <div className="h-[300px] flex gap-4 shrink-0">
                            {/* Route Map Card */}
                            <div className="w-80 bg-white/90 backdrop-blur-md rounded-[16px] shadow-xl border border-white shrink-0 flex flex-col pointer-events-auto">

                                <div className="flex-1 rounded-[16px] overflow-hidden border border-slate-200 relative bg-white">
                                    {/* Overlay HUD for Map (Multiple Cards) */}
                                    <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-auto">
                                        <div className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl border border-white shadow-lg">
                                            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">Route map</h3>
                                        </div>
                                    </div>

                                    <div className="absolute top-3 right-3 z-10 flex items-center gap-2 pointer-events-auto">
                                        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-white/90 backdrop-blur-md text-emerald-600 rounded-xl border border-white shadow-lg ring-1 ring-emerald-50 font-bold text-[7px] uppercase tracking-tighter">
                                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> In route
                                        </div>
                                        <a href={`/map?vehicle_id=${selectedVehicle.id}`} className="bg-white/90 backdrop-blur-md rounded-xl border border-white shadow-lg pointer-events-auto">
                                            <IconButton icon={Maximize2} small />
                                        </a>
                                    </div>

                                    <GoogleMap
                                        center={{ lat: 5.345, lng: -4.020 }}
                                        zoom={15}
                                        styles={WHITE_MAP_STYLE}
                                    >
                                        <Marker
                                            position={{ lat: 5.345, lng: -4.020 }}
                                            icon={{
                                                path: "M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z",
                                                fillColor: "#3b82f6",
                                                fillOpacity: 1,
                                                strokeWeight: 2,
                                                strokeColor: "#ffffff",
                                                scale: 1.5,
                                                anchor: { x: 12, y: 12 } as any
                                            }}
                                        />
                                    </GoogleMap>
                                </div>
                            </div>

                            {/* Statistics Card (Center) */}
                            <div className="flex-1 bg-white/90 backdrop-blur-md rounded-[28px] p-5 shadow-xl border border-white flex flex-col justify-between overflow-hidden pointer-events-auto">
                                <div className="flex items-center justify-between mb-1 shrink-0">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Daily active time</span>
                                        <span className="text-sm font-black text-slate-800 leading-none">8h 40min / 10h</span>
                                    </div>
                                    <div className="w-10 h-10 rounded-full border-4 border-slate-50 relative group overflow-hidden">
                                        <svg className="w-full h-full -rotate-90">
                                            <circle cx="20" cy="20" r="16" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                                            <circle cx="20" cy="20" r="16" fill="none" stroke="#2563eb" strokeWidth="4" strokeDasharray="100.5" strokeDashoffset="20" />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black tabular-nums">80%</span>
                                    </div>
                                </div>

                                <div className="mb-1 shrink-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Speed avg</span>
                                        <span className="text-[12px] font-black text-slate-800 tabular-nums">72 km/h</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1 bg-slate-100 rounded-full relative">
                                            <div className="absolute left-[72%] w-1.5 h-1.5 -translate-y-[1px] bg-emerald-500 rounded-full shadow-lg" />
                                        </div>
                                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">Optimal</span>
                                    </div>
                                </div>

                                <div className="shrink-0">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Condition</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[14px] font-black text-slate-800 tabular-nums">91%</span>
                                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">Optimal</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 overflow-hidden">
                                        {[90, 90, 80, 89, 92].map((v, i) => (
                                            <div key={i} className="flex-1 h-4 bg-blue-50 rounded-sm relative overflow-hidden group">
                                                <div className="absolute bottom-0 left-0 right-0 bg-blue-600 transition-all duration-1000" style={{ height: `${v}%` }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Camera Preview Card (Right) */}
                            <div className="flex-1 bg-white/90 backdrop-blur-md rounded-[28px] p-4 shadow-xl border border-white flex flex-col min-w-0 pointer-events-auto">
                                <div className="flex items-center justify-between mb-2 shrink-0">
                                    <h3 className="text-sm font-black text-slate-800">Camera</h3>
                                    <IconButton icon={Maximize2} small />
                                </div>
                                <div className="flex-1 bg-slate-950 rounded-[20px] overflow-hidden relative border border-slate-800 shadow-xl">
                                    <img src="https://images.unsplash.com/photo-1542362567-b05261b2024c?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover opacity-50 contrast-125" alt="Camera" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                    <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-rose-600/90 text-[7px] font-black uppercase text-white rounded-full animate-pulse">
                                        <div className="w-1 h-1 rounded-full bg-white" /> Live
                                    </div>
                                    <div className="absolute bottom-2 left-2 text-[8px] font-mono text-white/50">TR-001</div>
                                    <div className="absolute bottom-2 right-2 text-[8px] font-mono text-white/50 tracking-widest">04:39:16</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Truck List HUD */}
                    <div className="w-80 bg-white/95 backdrop-blur-md rounded-[32px] shadow-2xl border border-white flex flex-col p-5 shrink-0 overflow-hidden pointer-events-auto">
                        <div className="flex items-center justify-between mb-5 shrink-0">
                            <h2 className="text-xl font-black text-slate-800 leading-none">Truck list</h2>
                            <IconButton icon={Settings} small />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                            {vehicles.map((v) => {
                                const vhc = transformVehicle(v);
                                return (
                                    <button
                                        key={vhc.id}
                                        onClick={() => setSelectedVehicle(vhc)}
                                        className={`w-full text-left p-4 rounded-[24px] border transition-all duration-300 relative group overflow-hidden ${selectedVehicle.id === vhc.id ? 'bg-white ring-2 ring-blue-600 shadow-xl shadow-blue-100' : 'bg-slate-50/50 border-transparent hover:bg-slate-100/80'}`}
                                    >
                                        <div className="flex gap-3 mb-3 shrink-0">
                                            <div className="w-14 h-9 bg-white rounded-lg border border-slate-100 overflow-hidden flex items-center justify-center p-1 shrink-0">
                                                <Truck size={22} className="text-slate-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[12px] font-black text-slate-800 truncate">{vhc.name}</span>
                                                    <span className="text-[8px] font-black text-emerald-500 uppercase flex items-center gap-1 shrink-0">
                                                        <div className="w-1 h-1 rounded-full bg-emerald-500" /> {vhc.status}
                                                    </span>
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">{vhc.id}</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-end mb-2.5 shrink-0">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-1">Burden</span>
                                                <span className="text-[10px] font-black text-slate-800 tabular-nums">{vhc.burden}</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-1">Used volume</span>
                                                <span className="text-[10px] font-black text-slate-800 tabular-nums">{vhc.volume}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-[8px] font-bold text-slate-400 uppercase shrink-0">Used capacity</span>
                                            <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                                                <div className={`h-full transition-all duration-700 ${selectedVehicle.id === vhc.id ? 'bg-blue-600' : 'bg-slate-400'}`} style={{ width: `${vhc.capacity}%` }} />
                                            </div>
                                            <span className="text-[9px] font-black tabular-nums shrink-0">{vhc.capacity}%</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function NavButton({ icon: Icon, label, active = false }: { icon: any, label?: string, active?: boolean }) {
    return (
        <button className={`p-2 rounded-xl flex items-center gap-2 transition-all ${active ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>
            <Icon size={18} />
            {label && <span className="text-xs font-black">{label}</span>}
        </button>
    );
}

function IconButton({ icon: Icon, small = false, onClick }: { icon: any, small?: boolean, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`${small ? 'p-1.5' : 'p-2.5'} bg-white text-slate-400 rounded-xl border border-slate-100 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm active:scale-95`}
        >
            <Icon size={small ? 14 : 18} />
        </button>
    );
}

function StatLabel({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">{label}</span>
            <span className="text-xs font-black text-slate-800 tabular-nums leading-none">{value}</span>
        </div>
    );
}

function TelemetryCard({ label, value, icon: Icon }: { label: string, value: string, icon: any }) {
    return (
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-2 relative overflow-hidden group min-w-0">
            <Icon size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
            <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</span>
                <span className="text-lg font-black text-slate-800 tabular-nums leading-none">{value}</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200">
                <div className="h-full bg-blue-600 transition-all duration-700" style={{ width: value.includes('%') ? value : '50%' }} />
            </div>
        </div>
    );
}
