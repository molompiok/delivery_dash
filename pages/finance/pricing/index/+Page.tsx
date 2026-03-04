import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    Plus, Check, Settings2, Trash2,
    ChevronRight, Calculator, Info,
    AlertCircle, Layout, Tag,
    ArrowRight, Filter, Scale,
    Clock, Zap, Shield, HelpCircle,
    Gem, MapPin, Search, PlusCircle,
    Sparkles, Layers, Globe, Activity
} from 'lucide-react';
import { paymentsService } from '../../../../api/payments';
import { PricingFilter, OrderTemplate } from '../../../../api/types';

export default function Page() {
    const [filters, setFilters] = useState<PricingFilter[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<OrderTemplate | 'ALL'>('ALL');
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingFilter, setEditingFilter] = useState<PricingFilter | null>(null);

    useEffect(() => {
        loadFilters();
    }, []);

    const loadFilters = async () => {
        setLoading(true);
        try {
            const data = await paymentsService.getPricingFilters();
            setFilters(data);
        } catch (error) {
            console.error('Failed to load filters:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingFilter(null);
        setIsEditorOpen(true);
    };

    const handleEdit = (filter: PricingFilter) => {
        setEditingFilter(filter);
        setIsEditorOpen(true);
    };

    const handleToggleActive = async (filterId: string) => {
        const target = filters.find(f => f.id === filterId);
        if (!target) return;

        const newStatus = !target.isActive;

        try {
            // Optimistic update
            setFilters(prev => prev.map(f => {
                if (f.id === filterId) return { ...f, isActive: newStatus };
                if (newStatus && target.template && f.template === target.template && f.id !== filterId) {
                    return { ...f, isActive: false };
                }
                return f;
            }));

            await paymentsService.updatePricingFilter(filterId, { isActive: newStatus });
        } catch (error) {
            console.error('Failed to toggle active status:', error);
            loadFilters(); // Rollback
        }
    };

    const handleDelete = async (filterId: string) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce tarif ? Cette action est irréversible.')) {
            try {
                await paymentsService.deletePricingFilter(filterId);
                setFilters(prev => prev.filter(f => f.id !== filterId));
            } catch (error) {
                console.error('Failed to delete filter:', error);
            }
        }
    };

    const filteredData = filters.filter(f => {
        const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTemplate = selectedTemplate === 'ALL' || f.template === selectedTemplate;
        return matchesSearch && matchesTemplate;
    });

    const activeByTemplate = filters.reduce((acc, f) => {
        if (f.isActive && f.template) {
            acc[f.template] = f.name;
        }
        return acc;
    }, {} as Record<string, string>);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">Chargement de la configuration tarifaire...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4 md:px-8">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-1">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <a href="/finance" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-500 transition-colors">Finance</a>
                        <ChevronRight className="text-slate-400" size={16} />
                        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Configuration</span>
                        </div>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        Tarification
                        <Tag className="text-emerald-500" size={32} />
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
                        Définissez vos règles de calcul basées sur la distance, le poids et le type de mission.
                        Un seul tarif peut être actif par type de commande.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                   
                    <button
                        onClick={handleCreate}
                        className="group relative flex items-center gap-2 bg-slate-900 dark:bg-emerald-600 text-white px-5 md:px-6 py-3.5 md:py-4 rounded-3xl font-bold shadow-xl hover:shadow-emerald-500/20 hover:scale-[1.02] transition-all overflow-hidden active:scale-95 text-sm shrink-0"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <PlusCircle size={22} />
                        Nouveau tarif
                    </button>
                     <a
                        href="/finance/pricing/zone_matrix"
                        className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-5 md:px-6 py-3.5 md:py-4 rounded-3xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm text-sm"
                    >
                        Tarifs de zones
                        <ChevronRight size={18} />
                    </a>
                </div>
            </header>

            {/* Editor Drawer */}
            <PricingEditor
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                filter={editingFilter}
                onSave={async (data) => {
                    try {
                        if (editingFilter) {
                            const updated = await paymentsService.updatePricingFilter(editingFilter.id, data);
                            setFilters(prev => prev.map(f => f.id === editingFilter.id ? updated : f));
                        } else {
                            const created = await paymentsService.createPricingFilter(data);
                            setFilters(prev => [created, ...prev]);
                        }
                        setIsEditorOpen(false);
                    } catch (error) {
                        console.error('Failed to save filter:', error);
                    }
                }}
            />

            {/* Quick Stats / Active Policies */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { id: 'MISSION', label: 'Missions & Rondes', icon: Activity, bgImage: '/assets/mission_bg.png', theme: 'from-emerald-500 to-emerald-700' },
                    { id: 'VOYAGE', label: 'Voyage & Transport', icon: Globe, bgImage: '/assets/voyage_bg.png', theme: 'from-purple-500 to-violet-700' },
                    { id: 'COMMANDE', label: 'Livraison & VTC', icon: Layers, bgImage: '/assets/commande_bg.png', theme: 'from-indigo-500 to-blue-700' }
                ].map((tpl) => {
                    const activeName = activeByTemplate[tpl.id];
                    const Icon = tpl.icon;
                    return (
                        <div key={tpl.id} className={`relative overflow-hidden rounded-[2.5rem] p-6 text-white shadow-xl transition-all duration-500 group bg-gradient-to-br ${tpl.theme} hover:shadow-2xl hover:-translate-y-1`}>
                            {/* 3D Asset Background */}
                            <div className="absolute top-0 right-0 w-[60%] h-[120%] -translate-y-[10%] group-hover:scale-105 transition-transform duration-1000 pointer-events-none opacity-90">
                                <div className="relative w-full h-full">
                                    {/* <div className={`absolute inset-y-0 left-0 w-24 bg-gradient-to-r ${tpl.theme.split(' ')[0]} to-transparent z-10`}></div> */}
                                    <img src={tpl.bgImage} className="w-full h-full object-contain object-right" alt={`${tpl.label} bg`} />
                                </div>
                            </div>

                            <div className="relative z-10 flex flex-col h-full justify-between min-h-[140px]">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center">
                                        <Icon size={24} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/80">
                                            {tpl.label}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-8">
                                    <p className="text-[10px] uppercase font-bold text-white/60 mb-1 tracking-widest">Stratégie active</p>
                                    <h4 className="text-xl font-black truncate">
                                        {activeName || <span className="text-white/50 font-medium italic text-lg tracking-tight">Aucune config</span>}
                                    </h4>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </section>

            {/* Main Listing Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50 dark:bg-slate-800/20 p-4 rounded-3xl border border-slate-100 dark:border-slate-800/50 backdrop-blur-xl">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher un tarif..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                    {['ALL', 'MISSION', 'VOYAGE', 'COURSE', 'DELIVERY'].map((tpl) => (
                        <button
                            key={tpl}
                            onClick={() => setSelectedTemplate(tpl as any)}
                            className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all whitespace-nowrap border ${selectedTemplate === tpl
                                ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20 scale-105'
                                : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            {tpl === 'ALL' ? 'Tous' : tpl}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredData.map(filter => (
                    <PricingCard
                        key={filter.id}
                        filter={filter}
                        handleEdit={handleEdit}
                        handleToggleActive={handleToggleActive}
                        handleDelete={handleDelete}
                    />
                ))}

                {filteredData.length === 0 && (
                    <div className="col-span-full py-20 bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300">
                            <Tag size={32} />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">Aucun tarif trouvé</p>
                            <p className="text-slate-500">Essayez de modifier vos filtres ou créez votre premier tarif.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Components & Helpers ──

function InputField({ label, value, onChange, icon, max, placeholder }: { label: string, value: any, onChange: (val: number) => void, icon?: React.ReactNode, max?: number, placeholder?: string }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter ml-1">{label}</label>
            <div className="relative group/input">
                {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors">{icon}</div>}
                <input
                    type="number"
                    value={value}
                    onChange={e => {
                        let val = parseFloat(e.target.value) || 0;
                        if (max !== undefined && val > max) val = max;
                        onChange(val);
                    }}
                    placeholder={placeholder}
                    className={`w-full ${icon ? 'pl-11' : 'px-6'} py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-black text-slate-900 dark:text-white shadow-sm placeholder:text-slate-300 dark:placeholder:text-slate-700`}
                />
            </div>
        </div>
    );
}

function MultiplierField({ label, value, onChange, color }: { label: string, value: number, onChange: (val: number) => void, color: string }) {
    const colors: any = {
        orange: 'text-orange-500 bg-orange-50 dark:bg-orange-500/5 border-orange-100 dark:border-orange-500/20',
        purple: 'text-purple-500 bg-purple-50 dark:bg-purple-500/5 border-purple-100 dark:border-purple-500/20',
        blue: 'text-blue-500 bg-blue-50 dark:bg-blue-500/5 border-blue-100 dark:border-blue-500/20',
    };

    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter ml-1 truncate block">{label}</label>
            <div className="relative">
                <input
                    type="number"
                    step="0.1"
                    value={value}
                    onChange={e => onChange(parseFloat(e.target.value) || 1)}
                    className={`w-full pl-8 pr-4 py-4 ${colors[color]} border rounded-2xl focus:outline-none focus:ring-4 focus:ring-current transition-all font-black appearance-none`}
                />
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-black ${colors[color].split(' ')[0]}`}>x</span>
            </div>
        </div>
    );
}

function MultiplierMiniBadge({ label, value, color }: { label: string, value: number, color: 'orange' | 'purple' | 'blue' }) {
    const colors = {
        orange: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 border-orange-100 dark:border-orange-500/20',
        purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 border-purple-100 dark:border-purple-500/20',
        blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 border-blue-100 dark:border-blue-500/20',
    };
    return (
        <div className={`p-3 rounded-2xl border ${colors[color]} flex flex-col items-center gap-0.5`}>
            <span className="text-[8px] font-black uppercase tracking-tighter opacity-60">{label}</span>
            <span className="font-black text-sm">x{value}</span>
        </div>
    );
}

// ── Main Components ──

function PricingEditor({ isOpen, onClose, filter, onSave }: { isOpen: boolean, onClose: () => void, filter: PricingFilter | null, onSave: (data: Partial<PricingFilter>) => void }) {
    const [isMounted, setIsMounted] = useState(false);
    const [formData, setFormData] = useState<Partial<PricingFilter>>({
        name: '',
        template: 'MISSION',
        baseFee: 1000,
        perKmRate: 100,
        minDistance: 1,
        maxDistance: null,
        perKgRate: 50,
        freeWeightKg: 5,
        perM3Rate: 200,
        fragileMultiplier: 1.2,
        urgentMultiplier: 1.5,
        nightMultiplier: 1.3,
        proximityDiscountPercent: 10,
        proximityThresholdKm: 2,
        heavyLoadSurchargeThresholdKg: 50,
        heavyLoadSurchargePercent: 15,
        lightLoadDiscountThresholdKg: 1,
        lightLoadDiscountPercent: 5,
        zoneMatrixEnabled: false,
        zoneMatrix: { pairs: [] },
    });

    useEffect(() => {
        if (filter) {
            setFormData({
                ...filter,
                zoneMatrixEnabled: filter.zoneMatrixEnabled ?? false,
                zoneMatrix: {
                    pairs: filter.zoneMatrix?.pairs || [],
                },
            });
        } else {
            setFormData({
                name: '',
                template: 'MISSION',
                baseFee: 1000,
                perKmRate: 100,
                minDistance: 1,
                maxDistance: null,
                perKgRate: 50,
                freeWeightKg: 5,
                perM3Rate: 200,
                fragileMultiplier: 1.2,
                urgentMultiplier: 1.5,
                nightMultiplier: 1.3,
                proximityDiscountPercent: 10,
                proximityThresholdKm: 2,
                heavyLoadSurchargeThresholdKg: 50,
                heavyLoadSurchargePercent: 15,
                lightLoadDiscountThresholdKg: 1,
                lightLoadDiscountPercent: 5,
                zoneMatrixEnabled: false,
                zoneMatrix: { pairs: [] },
            });
        }
    }, [filter, isOpen]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isOpen || !isMounted) return null;



    return createPortal(
        <div className="fixed inset-0 z-[100] overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-500 animate-in fade-in"
                onClick={onClose}
            />

            {/* Slide-over Container */}
            <div className="fixed inset-0 z-[101] flex justify-end overflow-hidden pointer-events-none">
                {/* Modal content */}
                <div className="relative h-full w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out pointer-events-auto">
                    <header className="shrink-0 p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20 backdrop-blur-md sticky top-0 z-10">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                {filter ? 'Édition' : 'Création'}
                                <Sparkles className="text-emerald-500" size={24} />
                            </h2>
                            <p className="text-slate-400 font-medium text-sm">Configurez l'intégralité de la flexibilité tarifaire.</p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-rose-500 transition-all shadow-sm">
                            <Plus className="rotate-45" size={24} />
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 pb-32">
                        {/* section: General */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 text-slate-400">
                                <Layout size={18} />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Identité & Application</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-xs font-black text-slate-500 ml-2 uppercase tracking-tight">Nom de la règle</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ex: Livraison Urbaine & Long Distance"
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-slate-900 dark:text-white shadow-inner"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 ml-2 uppercase tracking-tight">Template cible</label>
                                    <div className="relative">
                                        <select
                                            value={formData.template || ''}
                                            onChange={e => setFormData({ ...formData, template: e.target.value as OrderTemplate })}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-slate-900 dark:text-white appearance-none shadow-inner"
                                        >
                                            <option value="MISSION">MISSION</option>
                                            <option value="VOYAGE">VOYAGE</option>
                                            <option value="COMMANDE">COMMANDE</option>
                                        </select>
                                        <ChevronRight size={18} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="col-span-2 rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-5 flex items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">Zone Matrix</p>
                                        <p className="text-xs text-slate-500">
                                            Active la tarification zone-&gt;zone en priorité avant KM/temps.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({
                                                ...prev,
                                                zoneMatrixEnabled: !(prev.zoneMatrixEnabled ?? false),
                                                zoneMatrix: prev.zoneMatrix || { pairs: [] },
                                            }))}
                                            className={`relative w-14 h-8 rounded-full transition-colors ${formData.zoneMatrixEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                                            aria-label="Activer zone matrix"
                                        >
                                            <span
                                                className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${formData.zoneMatrixEnabled ? 'translate-x-6' : 'translate-x-0'}`}
                                            />
                                        </button>
                                        <a
                                            href="/finance/pricing/zone_matrix"
                                            className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-xs font-black uppercase tracking-[0.1em] text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
                                        >
                                            Éditeur Avancé Matrix
                                            <ArrowRight size={14} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* section: Distance */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 text-slate-400">
                                <Globe size={18} />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Logistique Distance</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="Base de calcul (FCFA)" value={formData.baseFee} onChange={val => setFormData({ ...formData, baseFee: val })} icon={<Calculator size={16} />} />
                                <InputField label="Taux au Kilomètre" value={formData.perKmRate} onChange={val => setFormData({ ...formData, perKmRate: val })} icon={<MapPin size={16} />} />
                                <InputField label="Distance Min (km)" value={formData.minDistance} onChange={val => setFormData({ ...formData, minDistance: val })} />
                                <InputField label="Distance Max (km)" value={formData.maxDistance || 0} onChange={val => setFormData({ ...formData, maxDistance: val || null })} placeholder="Illimité" />
                            </div>
                        </section>

                        {/* section: Load */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 text-slate-400">
                                <Scale size={18} />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Poids & Volume</h3>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                <InputField label="Taux au KG" value={formData.perKgRate} onChange={val => setFormData({ ...formData, perKgRate: val })} />
                                <InputField label="Kg Gratuits" value={formData.freeWeightKg} onChange={val => setFormData({ ...formData, freeWeightKg: val })} />
                                <InputField label="Taux au M³" value={formData.perM3Rate} onChange={val => setFormData({ ...formData, perM3Rate: val })} />
                            </div>
                        </section>

                        {/* section: Multipliers */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 text-slate-400">
                                <Zap size={18} />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Surcharges Opérationnelles</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <MultiplierField label="Urgent" value={formData.urgentMultiplier || 1} onChange={val => setFormData({ ...formData, urgentMultiplier: val })} color="orange" />
                                <MultiplierField label="Nuit" value={formData.nightMultiplier || 1} onChange={val => setFormData({ ...formData, nightMultiplier: val })} color="purple" />
                                <MultiplierField label="Fragile" value={formData.fragileMultiplier || 1} onChange={val => setFormData({ ...formData, fragileMultiplier: val })} color="blue" />
                            </div>
                        </section>

                        {/* section: Advanced Discounts */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 text-slate-400">
                                <Sparkles size={18} />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Réductions & Surcharges Avancées</h3>
                            </div>
                            <div className="space-y-8 bg-slate-50 dark:bg-slate-800/30 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-inner">
                                {/* Proximity */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        Remise de Proximité (Multi-stops)
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField label="Remise (%)" value={formData.proximityDiscountPercent} onChange={val => setFormData({ ...formData, proximityDiscountPercent: val })} max={100} />
                                        <InputField label="Seuil Proximité (km)" value={formData.proximityThresholdKm} onChange={val => setFormData({ ...formData, proximityThresholdKm: val })} />
                                    </div>
                                </div>

                                {/* Heavy Load */}
                                <div className="space-y-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                                        Surcharge Charge Lourde
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField label="Surcharge (%)" value={formData.heavyLoadSurchargePercent} onChange={val => setFormData({ ...formData, heavyLoadSurchargePercent: val })} />
                                        <InputField label="Seuil Lourd (kg)" value={formData.heavyLoadSurchargeThresholdKg} onChange={val => setFormData({ ...formData, heavyLoadSurchargeThresholdKg: val })} />
                                    </div>
                                </div>

                                {/* Light Load */}
                                <div className="space-y-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        Remise Charge Légère
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField label="Remise (%)" value={formData.lightLoadDiscountPercent} onChange={val => setFormData({ ...formData, lightLoadDiscountPercent: val })} max={100} />
                                        <InputField label="Seuil Léger (kg)" value={formData.lightLoadDiscountThresholdKg} onChange={val => setFormData({ ...formData, lightLoadDiscountThresholdKg: val })} />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <footer className="shrink-0 p-6 md:p-8 border-t border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl flex gap-4 z-10">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent rounded-2xl font-bold text-slate-600 dark:text-slate-300 transition-all"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={() => onSave(formData)}
                            className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            {filter ? <Check size={20} /> : <Plus size={20} />}
                            {filter ? 'Mettre à jour' : 'Créer le tarif'}
                        </button>
                    </footer>
                </div>

                {/* The embedded Matrix Panel was removed in favor of the dedicated /finance/pricing/zone_matrix page */}
            </div>
        </div>,
        document.body
    );
}

function PricingCard({ filter, handleEdit, handleToggleActive, handleDelete }: { filter: PricingFilter, handleEdit: (filter: PricingFilter) => void, handleToggleActive: (filterId: string) => void, handleDelete: (id: string) => void }) {

    return (
        <div className={`group relative bg-white dark:bg-slate-900 rounded-4xl lg:rounded-6xl border-2 transition-all duration-500 overflow-hidden ${filter.isActive
            ? 'border-emerald-500 shadow-2xl shadow-emerald-500/10'
            : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm'
            }`}>
            {/* Status Ribon */}
            {filter.isActive && (
                <div className="absolute top-2 right-4 flex items-center gap-2 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] shadow-lg shadow-emerald-500/30">
                    <Check size={14} strokeWidth={4} />
                    Configuration Active
                </div>
            )}

            <div className="p-4 md:p-6">
                <header className="flex justify-between items-start mb-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${filter.template === 'MISSION' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' :
                                filter.template === 'VOYAGE' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600' :
                                    filter.template === 'COMMANDE' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600' :
                                        'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}>
                                {filter.template || 'Générique'}
                            </span>
                            {filter.maxDistance && (
                                <span className="px-3 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                    Limité ({filter.maxDistance}km)
                                </span>
                            )}
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                            {filter.name}
                        </h3>
                    </div>
                </header>

                {/* Main Metrics Dashboard */}
                <div className="grid grid-cols-2 gap-6 mb-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 md:p-4 rounded-[2rem] border border-slate-100 dark:border-slate-700/50 flex flex-col items-center gap-2 group/metric">
                        <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-emerald-500 group-hover/metric:scale-110 transition-all">
                            <Calculator size={20} />
                        </div>
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{filter.baseFee.toLocaleString()}</span>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Honoraires Base (FCFA)</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 md:p-4 rounded-[2rem] border border-slate-100 dark:border-slate-700/50 flex flex-col items-center gap-2 group/metric">
                        <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-blue-500 group-hover/metric:scale-110 transition-all">
                            <MapPin size={20} />
                        </div>
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{filter.perKmRate.toLocaleString()}</span>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Prix au Kilomètre</span>
                    </div>
                </div>

                {/* Secondary Specs Peek */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 text-slate-500">
                            <Scale size={18} className="text-slate-400" />
                            <span className="text-xs font-bold uppercase tracking-tight">Logistique Charge</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="font-black text-slate-900 dark:text-white">
                                {filter.perKgRate} FCFA / kg
                            </span>
                            {filter.perM3Rate > 0 && <span className="text-[10px] font-bold text-slate-400">{filter.perM3Rate} FCFA / m³</span>}
                        </div>
                    </div>
                </div>

                <footer className="mt-4 flex gap-4">
                    {!filter.isActive ? (
                        <button
                            onClick={() => handleToggleActive(filter.id)}
                            className="px-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/30 active:scale-95 transition-all"
                        >
                            Activer
                        </button>
                    ) : (
                        <div className="px-8 bg-slate-100 dark:bg-slate-800 text-slate-300 rounded-[1.8rem] flex items-center justify-center">
                            <Shield size={20} />
                        </div>
                    )}
                    <button
                        onClick={() => handleEdit(filter)}
                        className="w-16 h-16 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 hover:border-emerald-500/50 hover:text-emerald-500 rounded-[1.8rem] flex items-center justify-center transition-all group/edit"
                    >
                        <Settings2 size={22} className="group-hover/edit:rotate-45 transition-transform" />
                    </button>
                    <button
                        onClick={() => handleDelete(filter.id)}
                        className="w-16 h-16 bg-white dark:bg-slate-800 border-2 border-rose-50 dark:border-slate-800 hover:border-rose-500/50 hover:text-rose-500 rounded-[1.8rem] flex items-center justify-center transition-all group/del"
                    >
                        <Trash2 size={22} className="group-hover/del:rotate-12 transition-transform" />
                    </button>
                </footer>
            </div>

            {/* Ambient background decoration */}
            <div className={`absolute -bottom-20 -right-20 w-60 h-60 blur-[100px] pointer-events-none transition-colors duration-1000 ${filter.isActive ? 'bg-emerald-500/5' : 'bg-slate-400/5'}`} />
        </div>
    );
}
