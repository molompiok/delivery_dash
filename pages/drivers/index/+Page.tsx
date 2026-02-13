import React, { useEffect, useState } from 'react';
import {
    Users,
    Plus,
    Search,
    UserCheck,
    Clock,
    AlertTriangle,
    Filter,
    X,
    ChevronRight,
    Star,
    MapPin,
    Smartphone,
    Layers,
    TrendingUp,
    Shield
} from 'lucide-react';
import { driverService } from '../../../api/drivers';
import { CompanyDriverSetting } from '../../../api/types';
import { EmptyState } from '../../../components/EmptyState';
import { useHeaderAutoHide } from '../../../hooks/useHeaderAutoHide';

export default function Page() {
    useHeaderAutoHide();
    const [drivers, setDrivers] = useState<CompanyDriverSetting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeStatus, setActiveStatus] = useState('ALL');
    const [showFilters, setShowFilters] = useState(false);

    // Filter advanced states
    const [filters, setFilters] = useState({
        email: '',
        phone: '',
        role: 'ALL',
        minMissions: '',
        maxMissions: ''
    });

    useEffect(() => {
        loadDrivers();
    }, []);

    const loadDrivers = async () => {
        try {
            setIsLoading(true);
            const response = await driverService.listDrivers();
            // Enriching with mocked metrics
            const enrichedData = response.data.map((d: any) => ({
                ...d,
                metrics: {
                    totalMissions: Math.floor(Math.random() * 500) + 50,
                    rating: (Math.random() * (5 - 3.5) + 3.5).toFixed(1),
                    income: Math.floor(Math.random() * 500000) + 100000,
                    lastActive: 'Il y a 15 min'
                }
            }));
            setDrivers(enrichedData);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Impossible de charger les chauffeurs.');
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

    const filteredDrivers = drivers.filter(setting => {
        const d = setting.driver;

        // Search
        if (searchTerm) {
            const matchesName = d.fullName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesPhone = d.phone.includes(searchTerm);
            if (!matchesName && !matchesPhone) return false;
        }

        // Status Tabs
        if (activeStatus !== 'ALL') {
            if (activeStatus === 'ACCEPTED' && setting.status !== 'ACCEPTED') return false;
            if (activeStatus === 'PENDING' && setting.status !== 'PENDING') return false;
            if (activeStatus === 'REJECTED' && setting.status !== 'REJECTED') return false;
        }

        // Advanced Filters
        if (filters.email && !d.email.toLowerCase().includes(filters.email.toLowerCase())) return false;
        if (filters.phone && !d.phone.includes(filters.phone)) return false;
        // ... more filter logic if needed

        return true;
    });

    const statusFilters = [
        { id: 'ALL', label: 'Tout', icon: <Layers size={14} />, count: drivers.length },
        { id: 'ACCEPTED', label: 'Actifs', icon: <UserCheck size={14} />, count: drivers.filter(d => d.status === 'ACCEPTED').length },
        { id: 'PENDING', label: 'En attente', icon: <Clock size={14} />, count: drivers.filter(d => d.status === 'PENDING').length },
        { id: 'REJECTED', label: 'Refusés', icon: <AlertTriangle size={14} />, count: drivers.filter(d => d.status === 'REJECTED').length },
    ];

    if (isLoading && drivers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-24 space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 dark:text-slate-400 font-medium italic">Chargement de l'élite logistique...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Mes Chauffeurs</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Pilotez et suivez les performances de votre flotte humaine.</p>
                </div>
                <div className="flex items-center gap-3">
                    <a
                        href="/drivers/invite"
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus size={20} />
                        <span>Inviter un Chauffeur</span>
                    </a>
                </div>
            </div>

            {/* List Container */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 relative">
                {/* Control Bar */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col xl:flex-row gap-4 justify-between items-center relative z-20 rounded-t-3xl">
                    <div className="relative w-full md:max-w-xs group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Saisir un nom ou téléphone..."
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
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl"><Filter size={18} /></div>
                                Filtrage Chauffeurs
                            </h3>
                            <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Email</label>
                                    <input type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl text-sm dark:text-slate-200" placeholder="ex: jean@mail.com" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Role</label>
                                    <select className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl text-sm dark:text-slate-200">
                                        <option>Tous les rôles</option>
                                        <option>Freelance</option>
                                        <option>Titulaire</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Volume de missions</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="number" placeholder="Min" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl text-sm dark:text-slate-200" />
                                    <input type="number" placeholder="Max" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl text-sm dark:text-slate-200" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-10 flex gap-3">
                            <button className="flex-1 py-3 text-slate-500 dark:text-slate-400 font-bold text-sm bg-slate-50 dark:bg-slate-800 rounded-xl">Réinitialiser</button>
                            <button onClick={() => setShowFilters(false)} className="flex-[2] py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none">Appliquer les filtres</button>
                        </div>
                    </div>
                )}

                {/* Content Section */}
                <div className="overflow-hidden rounded-b-[2rem]">
                    {error ? (
                        <div className="p-12">
                            <EmptyState
                                icon={AlertTriangle}
                                title="Erreur de Synchronisation"
                                description={error}
                                variant="error"
                                action={{ label: "Réessayer", onClick: loadDrivers }}
                            />
                        </div>
                    ) : filteredDrivers.length === 0 ? (
                        <div className="p-12">
                            <EmptyState
                                icon={Users}
                                title="Aucun Chauffeur"
                                description="Élargissez votre recherche ou invitez de nouveaux talents."
                                action={{ label: "Inviter un chauffeur", href: "/drivers/invite" }}
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-slate-400 dark:text-slate-500 text-[11px] uppercase tracking-wider font-bold border-b border-slate-50 dark:border-slate-800">
                                        <th className="px-6 py-4">Profil / Contact</th>
                                        <th className="px-6 py-4">Performance</th>
                                        <th className="px-6 py-4">Historique</th>
                                        <th className="px-6 py-4">Gains (FCFA)</th>
                                        <th className="px-6 py-4">Statut</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredDrivers.map(setting => {
                                        const d = setting.driver;
                                        const m = (setting as any).metrics;
                                        return (
                                            <tr
                                                key={d.id}
                                                className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all cursor-pointer"
                                                onClick={() => window.location.href = `/drivers/${d.id}`}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-100 dark:shadow-none flex-shrink-0">
                                                            {(d.fullName || d.email || 'C').split(' ').map(n => n[0] || '').join('').toUpperCase().substring(0, 2)}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{d.fullName}</span>
                                                            <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-1">
                                                                <Smartphone size={10} /> {d.phone}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-1 text-sm font-bold text-amber-500">
                                                            <Star size={14} fill="currentColor" /> {m.rating}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score Excellence</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 font-mono">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{m.totalMissions} missions</span>
                                                        <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 mt-1">
                                                            <TrendingUp size={10} /> +12% ce mois
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tighter">{m.income.toLocaleString()}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {setting.status === 'ACCEPTED' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 uppercase italic">
                                                            <Shield size={12} /> OPÉRATIONNEL
                                                        </span>
                                                    ) : setting.status === 'PENDING' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 uppercase italic">
                                                            <Clock size={12} /> EN ATTENTE
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 uppercase italic">
                                                            <AlertTriangle size={12} /> REFUSÉ
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
                    <div className="p-4 bg-slate-50/30 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                        <p className="font-medium">Affichage de <b>{filteredDrivers.length}</b> conducteurs certifiés</p>
                        <div className="flex gap-2">
                            <button className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-bold text-xs disabled:opacity-40">Précédent</button>
                            <button className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-bold text-xs">Suivant</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
