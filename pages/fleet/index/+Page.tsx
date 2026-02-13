import React, { useEffect, useState } from 'react';
import {
    Truck,
    Plus,
    Search,
    AlertCircle,
    CheckCircle,
    Clock,
    Building2,
    ChevronRight,
    Filter,
    X,
    Layers,
    Gauge,
    Fuel,
    Calendar,
    MapPin,
    ShieldCheck
} from 'lucide-react';
import { fleetService } from '../../../api/fleet';
import { Vehicle, User } from '../../../api/types';
import { EmptyState } from '../../../components/EmptyState';

const VEHICLE_TYPE_LABELS: Record<string, string> = {
    'MOTO': 'Moto',
    'CAR_SEDAN': 'Voiture',
    'VAN': 'Utilitaire',
    'TRUCK': 'Poids Lourd',
    'BICYCLE': 'Vélo'
};

export default function Page() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeStatus, setActiveStatus] = useState('ALL');
    const [showFilters, setShowFilters] = useState(false);
    const [companyMissing, setCompanyMissing] = useState(false);

    // Advanced filters
    const [filters, setFilters] = useState({
        type: 'ALL',
        minFuel: '',
        needsMaintenance: false
    });

    useEffect(() => {
        loadVehicles();
    }, []);

    const loadVehicles = async () => {
        try {
            setIsLoading(true);
            const userStr = localStorage.getItem('delivery_user');
            if (!userStr) {
                setIsLoading(false);
                return;
            }
            let user: User = JSON.parse(userStr);

            if (!user.companyId) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const freshUserStr = localStorage.getItem('delivery_user');
                if (freshUserStr) user = JSON.parse(freshUserStr);
            }

            if (!user.companyId) {
                setCompanyMissing(true);
                setIsLoading(false);
                return;
            }

            const response = await fleetService.listVehicles(user.companyId);

            // Enriching with mocked telemetry
            const enrichedData = response.data.map((v: any) => ({
                ...v,
                telemetry: {
                    fuelLevel: Math.floor(Math.random() * 100),
                    mileage: Math.floor(Math.random() * 50000) + 5000,
                    nextMaintenance: 'Dans ' + (Math.floor(Math.random() * 3000) + 500) + ' km',
                    isMaintenanceUrgent: Math.random() > 0.8
                }
            }));

            setVehicles(enrichedData);
            setCompanyMissing(false);
        } catch (err) {
            setError('Impossible de charger les véhicules.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('fr-FR', {
            notation: 'compact',
            maximumFractionDigits: 1
        }).format(num);
    };

    const filteredVehicles = vehicles.filter(v => {
        // Search
        if (searchTerm) {
            const matchesPlate = v.plate.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesModel = v.model.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesBrand = v.brand.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesPlate && !matchesModel && !matchesBrand) return false;
        }

        // Status Tabs
        if (activeStatus !== 'ALL') {
            if (activeStatus === 'APPROVED' && v.verificationStatus !== 'APPROVED') return false;
            if (activeStatus === 'PENDING' && v.verificationStatus !== 'PENDING') return false;
            if (activeStatus === 'REJECTED' && v.verificationStatus !== 'REJECTED') return false;
        }

        return true;
    });

    const statusFilters = [
        { id: 'ALL', label: 'Tout', icon: <Layers size={14} />, count: vehicles.length },
        { id: 'APPROVED', label: 'Vérifiés', icon: <CheckCircle size={14} />, count: vehicles.filter(v => v.verificationStatus === 'APPROVED').length },
        { id: 'PENDING', label: 'En attente', icon: <Clock size={14} />, count: vehicles.filter(v => v.verificationStatus === 'PENDING').length },
        { id: 'REJECTED', label: 'Rejetés', icon: <AlertCircle size={14} />, count: vehicles.filter(v => v.verificationStatus === 'REJECTED').length },
    ];

    if (isLoading && vehicles.length === 0 && !companyMissing) {
        return (
            <div className="flex flex-col items-center justify-center p-24 space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 dark:text-slate-400 font-medium italic">Inspection de la flotte en cours...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Ma Flotte</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Gestion technique et conformité de vos véhicules.</p>
                </div>
                {!companyMissing && (
                    <div className="flex items-center gap-3">
                        <a
                            href="/fleet/add"
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Plus size={20} />
                            <span>Ajouter un Véhicule</span>
                        </a>
                    </div>
                )}
            </div>

            {companyMissing ? (
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-12">
                    <EmptyState
                        icon={Building2}
                        title="Entreprise non configurée"
                        description="Veuillez associer votre compte à une entreprise pour gérer une flotte."
                        variant="warning"
                        action={{ label: "Réessayer", onClick: loadVehicles }}
                    />
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 relative">
                    {/* Control Bar */}
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col xl:flex-row gap-4 justify-between items-center relative z-20 rounded-t-3xl">
                        <div className="relative w-full md:max-w-xs group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Rechercher par plaque ou modèle..."
                                className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm text-sm dark:text-slate-200"
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

                        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/50 dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700 transition-all">
                            {statusFilters.map((filter) => (
                                <button
                                    key={filter.id}
                                    onClick={() => setActiveStatus(filter.id)}
                                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${activeStatus === filter.id
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                        }`}
                                >
                                    {filter.icon}
                                    <span>{filter.label}</span>
                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] ${activeStatus === filter.id ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                        }`}>
                                        {filter.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Advanced Filter Panel */}
                    {showFilters && (
                        <div className="absolute top-20 left-4 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 z-50 animate-in slide-in-from-top-4 duration-300 w-full max-w-xl">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3 italic">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl"><Gauge size={18} /></div>
                                    Filtres Télémétrie
                                </h3>
                                <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Usage Carburant</label>
                                    <div className="flex gap-2">
                                        {[25, 50, 75].map(v => (
                                            <button key={v} className="flex-1 py-2 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-400 transition-all text-slate-600 dark:text-slate-400">
                                                {v}%+ restant
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Maintenance</label>
                                        <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl">
                                            <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 dark:bg-slate-700 dark:border-slate-600" />
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Urgence seulement</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Type</label>
                                        <select className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-medium dark:text-slate-200">
                                            <option>Tous Types</option>
                                            <option>Moto</option>
                                            <option>Utilitaire</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-10 flex gap-3">
                                <button className="flex-1 py-3 text-slate-500 dark:text-slate-400 font-bold text-sm bg-slate-50 dark:bg-slate-800 rounded-xl">Réinitialiser</button>
                                <button onClick={() => setShowFilters(false)} className="flex-[2] py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none">Analyser la flotte</button>
                            </div>
                        </div>
                    )}

                    {/* Content Section */}
                    <div className="overflow-hidden rounded-b-[2rem]">
                        {error ? (
                            <div className="p-12">
                                <EmptyState
                                    icon={AlertCircle}
                                    title="Défaut de Connexion"
                                    description={error}
                                    variant="error"
                                    action={{ label: "Réessayer", onClick: loadVehicles }}
                                />
                            </div>
                        ) : filteredVehicles.length === 0 ? (
                            <div className="p-12">
                                <EmptyState
                                    icon={Truck}
                                    title="Garage Vide"
                                    description="Aucun véhicule ne correspond à vos critères."
                                    action={{ label: "Ajouter un véhicule", href: "/fleet/add" }}
                                />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-slate-400 dark:text-slate-500 text-[11px] uppercase tracking-wider font-bold border-b border-slate-50 dark:border-slate-800">
                                            <th className="px-6 py-4">Véhicule / Plaque</th>
                                            <th className="px-6 py-4">Assignation</th>
                                            <th className="px-6 py-4">Usage (Mileage)</th>
                                            <th className="px-6 py-4">Maintenance</th>
                                            <th className="px-6 py-4">Niveau Carburant</th>
                                            <th className="px-6 py-4">Statut</th>
                                            <th className="px-6 py-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                        {filteredVehicles.map(v => {
                                            const t = (v as any).telemetry;
                                            return (
                                                <tr
                                                    key={v.id}
                                                    className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all cursor-pointer"
                                                    onClick={() => window.location.href = `/fleet/${v.id}`}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200 dark:shadow-none flex-shrink-0">
                                                                <Truck size={20} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{v.brand} {v.model}</span>
                                                                <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded-md inline-block w-fit">{v.plate}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {v.assignedDriver ? (
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                                                                    {(v.assignedDriver.fullName || 'V').charAt(0).toUpperCase()}
                                                                </div>
                                                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{v.assignedDriver.fullName}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase italic">Libre</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{t.mileage.toLocaleString()} km</span>
                                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-0.5 tracking-tighter italic">Totalisateur</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className={`flex items-center gap-2 text-[10px] font-bold px-2.5 py-1.5 rounded-xl w-fit ${t.isMaintenanceUrgent ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700'}`}>
                                                            <Calendar size={12} />
                                                            {t.nextMaintenance}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-2 w-32">
                                                            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 dark:text-slate-500">
                                                                <div className="flex items-center gap-1"><Fuel size={10} /> {t.fuelLevel}%</div>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full transition-all duration-1000 ${t.fuelLevel < 20 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'}`}
                                                                    style={{ width: `${t.fuelLevel}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6 font-bold">
                                                        {v.verificationStatus === 'APPROVED' ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 uppercase italic">
                                                                <ShieldCheck size={12} /> CONFORME
                                                            </span>
                                                        ) : v.verificationStatus === 'PENDING' ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 uppercase italic">
                                                                <Clock size={12} /> EN EXAMEN
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 uppercase italic">
                                                                <AlertCircle size={12} /> REJETÉ
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="p-2.5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 rounded-xl transition-all">
                                                            <ChevronRight size={20} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        <div className="p-4 bg-slate-50/30 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
                            <p>Flotte active : <b>{filteredVehicles.length}</b> unités opérationnelles</p>
                            <div className="flex gap-2">
                                <button className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-bold text-xs disabled:opacity-40">Précédent</button>
                                <button className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-bold text-xs">Suivant</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
