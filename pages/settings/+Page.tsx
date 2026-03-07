import React, { useEffect, useState, useRef } from 'react';
import { User as UserIcon, MapPin, Plus, Star, Trash2, Camera, Building2, Save, X, Edit2, Loader2, Globe, Mail, Phone, ShieldCheck } from 'lucide-react';
import { companyService } from '../../api/company';
import { authService } from '../../api/auth';
import { User, Address, Company } from '../../api/types';
import { useHeaderAutoHide } from '../../hooks/useHeaderAutoHide';
import { motion, AnimatePresence } from 'framer-motion';

export default function Page() {
    useHeaderAutoHide();
    const [user, setUser] = useState<User | null>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [requirements, setRequirements] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Edit states
    const [editMode, setEditMode] = useState<'NONE' | 'PROFILE' | 'COMPANY'>('NONE');
    const [profileForm, setProfileForm] = useState({ fullName: '', email: '' });
    const [companyForm, setCompanyForm] = useState({ name: '', description: '', registreCommerce: '' });

    // File refs
    const userPhotoRef = useRef<HTMLInputElement>(null);
    const companyLogoRef = useRef<HTMLInputElement>(null);

    // Address Form
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [newAddress, setNewAddress] = useState({ label: '', formattedAddress: '', lat: 5.34, lng: -4.02 });

    // Requirements Form
    const [newReq, setNewReq] = useState({ id: '', label: '' });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const userStr = localStorage.getItem('delivery_user');
            if (userStr) {
                const u = JSON.parse(userStr);
                setUser(u);
                setProfileForm({ fullName: u.fullName || '', email: u.email || '' });

                const [compRes, addrRes, reqRes] = await Promise.all([
                    companyService.getProfile(),
                    u.companyId ? companyService.getAddresses(u.companyId) : Promise.resolve({ data: [] }),
                    companyService.getRequirements()
                ]);

                setCompany(compRes.data);
                setCompanyForm({
                    name: compRes.data.name || '',
                    description: compRes.data.description || '',
                    registreCommerce: compRes.data.registreCommerce || ''
                });
                setAddresses(addrRes.data);
                setRequirements(reqRes.data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const res = await authService.updateProfile(profileForm);
            setUser(res.data.user);
            localStorage.setItem('delivery_user', JSON.stringify(res.data.user));
            setEditMode('NONE');
        } catch (err) {
            alert('Erreur lors de la mise à jour du profil');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateCompany = async () => {
        if (!company) return;
        setIsSaving(true);
        try {
            const res = await companyService.updateCompany(companyForm);
            setCompany(res.data);
            setEditMode('NONE');
        } catch (err) {
            alert('Erreur lors de la mise à jour de l\'entreprise');
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (type: 'USER' | 'COMPANY', file: File) => {
        setIsSaving(true);
        const formData = new FormData();
        formData.append(type === 'USER' ? 'photos' : 'logo', file);

        try {
            if (type === 'USER') {
                const res = await authService.updateProfile(formData);
                setUser(res.data.user);
                localStorage.setItem('delivery_user', JSON.stringify(res.data.user));
            } else {
                const res = await companyService.updateCompany(formData);
                setCompany(res.data);
            }
        } catch (err) {
            alert('Erreur lors de l\'envoi du fichier');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddRequirement = async (e: React.FormEvent) => {
        e.preventDefault();
        const updated = [...requirements, { id: newReq.id || newReq.label.toLowerCase().replace(/ /g, '_'), label: newReq.label }];
        try {
            await companyService.updateRequirements(updated);
            setRequirements(updated);
            setNewReq({ id: '', label: '' });
        } catch (err) {
            alert('Erreur');
        }
    };

    const handleDeleteRequirement = async (id: string) => {
        const updated = requirements.filter(r => r.id !== id);
        try {
            await companyService.updateRequirements(updated);
            setRequirements(updated);
        } catch (err) {
            alert('Erreur');
        }
    };

    const handleAddAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.companyId) return;

        try {
            await companyService.createAddress(user.companyId, {
                ...newAddress,
                isDefault: addresses.length === 0
            });
            setShowAddAddress(false);
            setNewAddress({ label: '', formattedAddress: '', lat: 5.34, lng: -4.02 });
            loadData();
        } catch (err) {
            alert('Erreur ajout adresse');
        }
    };

    const handleSetDefault = async (addressId: string) => {
        try {
            await companyService.setDefaultAddress(addressId);
            loadData();
        } catch (err) {
            alert('Erreur');
        }
    };

    if (isLoading) return (
        <div className="flex items-center justify-center p-24">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-12 pb-24 text-slate-900 dark:text-slate-100">
            {/* Header / Intro */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight italic text-slate-900 dark:text-slate-100">Paramètres</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Gérez votre identité et la configuration de votre entreprise.</p>
                </div>
                {isSaving && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black uppercase tracking-widest animate-pulse">
                        <Loader2 size={14} className="animate-spin" />
                        Synchronisation...
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Profile Card */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden group">
                    <div className={`relative h-32 ${user?.photos?.[0] ? '' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}  group`}>
                        {user?.photos?.[0] && (
                            <div
                                className="absolute inset-0 opacity-60 blur-sm scale-110 transition-all duration-700 group-hover:scale-125"
                                style={{
                                    backgroundImage: `url(${API_URL}/${user.photos[0]})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}
                            />
                        )}
                        <div className="absolute inset-0 bg-black/10" />
                        <div className="absolute -bottom-12 left-8">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-800 p-1 shadow-lg ring-4 ring-white/20">
                                    <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                        {user?.photos?.[0] ? (
                                            <img src={`${API_URL}/${user.photos[0]}`} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon size={32} className="text-slate-400" />
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => userPhotoRef.current?.click()}
                                    className="absolute -right-2 -bottom-2 p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-100 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 hover:scale-110 active:scale-95 transition-all"
                                >
                                    <Camera size={16} />
                                </button>
                                <input
                                    ref={userPhotoRef}
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => e.target.files?.[0] && handleFileUpload('USER', e.target.files[0])}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-16 p-8 space-y-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <h3 className="text-xl font-black tracking-tight">{user?.fullName}</h3>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-tighter w-fit">
                                    <ShieldCheck size={12} /> {user?.role}
                                </div>
                            </div>
                            <button
                                onClick={() => setEditMode(editMode === 'PROFILE' ? 'NONE' : 'PROFILE')}
                                className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all"
                            >
                                {editMode === 'PROFILE' ? <X size={20} /> : <Edit2 size={18} />}
                            </button>
                        </div>

                        <div className="space-y-4">
                            {editMode === 'PROFILE' ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom Complet</label>
                                        <input
                                            type="text"
                                            value={profileForm.fullName}
                                            onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                                        <input
                                            type="email"
                                            value={profileForm.email}
                                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={handleUpdateProfile}
                                        disabled={isSaving}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                                    >
                                        Enregistrer
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-50 dark:border-slate-800/50">
                                        <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-slate-400 shadow-sm"><Mail size={14} /></div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</span>
                                            <span className="text-sm font-bold tracking-tight">{user?.email}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-50 dark:border-slate-800/50">
                                        <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-slate-400 shadow-sm"><Phone size={14} /></div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Téléphone</span>
                                            <span className="text-sm font-bold tracking-tight">{user?.phone}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Company Section */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 p-8 space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-inner">
                                    <Building2 size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tighter italic">L'Entreprise</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Identité & Image de marque</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditMode(editMode === 'COMPANY' ? 'NONE' : 'COMPANY')}
                                className="p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"
                            >
                                {editMode === 'COMPANY' ? <X size={20} /> : <Edit2 size={18} />}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            {/* Logo Upload Card */}
                            <div className="md:col-span-1 space-y-3">
                                <div className="relative group cursor-pointer" onClick={() => companyLogoRef.current?.click()}>
                                    <div className="aspect-square rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-4 text-center transition-all group-hover:border-indigo-400 group-hover:bg-indigo-50/30 dark:group-hover:bg-indigo-500/5 group-hover:scale-105 active:scale-95 overflow-hidden">
                                        {company?.logo && typeof company.logo === 'string' ? (
                                            <img src={`${API_URL}/${company.logo}`} alt="Logo" className="w-full h-full object-contain" />
                                        ) : (
                                            <>
                                                <Camera size={24} className="text-slate-300 dark:text-slate-600 mb-2 group-hover:text-indigo-400 group-hover:bounce" />
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-500">Modifier le Logo</span>
                                            </>
                                        )}
                                        {/* Overlay always present on existing logo for feedback */}
                                        {company?.logo && (
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                                <Camera size={32} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={companyLogoRef}
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => e.target.files?.[0] && handleFileUpload('COMPANY', e.target.files[0])}
                                    />
                                </div>
                                <p className="text-center text-[8px] font-bold text-slate-400 uppercase tracking-widest italic px-2">Format PNG ou SVG recommandé (Max 2MB)</p>
                            </div>

                            <div className="md:col-span-3 space-y-6">
                                {editMode === 'COMPANY' ? (
                                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom de l'entreprise</label>
                                                <input
                                                    type="text"
                                                    value={companyForm.name}
                                                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RCCM / Registre</label>
                                                <input
                                                    type="text"
                                                    value={companyForm.registreCommerce}
                                                    onChange={(e) => setCompanyForm({ ...companyForm, registreCommerce: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                                            <textarea
                                                rows={3}
                                                value={companyForm.description}
                                                onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
                                                placeholder="Décrivez votre vision logistique..."
                                            />
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <button
                                                onClick={handleUpdateCompany}
                                                disabled={isSaving}
                                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                            >
                                                <Save size={16} /> Mettre à jour
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Raison Sociale</span>
                                                <span className="text-sm font-black tracking-tight">{company?.name || 'Non défini'}</span>
                                            </div>
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Activité Principale</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="p-1 px-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-200 dark:border-indigo-500/30">
                                                        {company?.activityType}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Bio / Vision</span>
                                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic line-clamp-2">
                                                {company?.description || "Aucune description renseignée pour le moment. Décrivez votre activité pour rassurer vos partenaires."}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Standard Requirements & Addresses (Existing but restyled) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Requirements */}
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 p-8 space-y-6">
                            <h2 className="text-xl font-black tracking-tighter flex items-center gap-3">
                                <div className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl shadow-inner"><Plus size={18} /></div>
                                Documents requis
                            </h2>
                            <form onSubmit={handleAddRequirement} className="relative group">
                                <input
                                    type="text"
                                    placeholder="Ex: Assurance"
                                    value={newReq.label}
                                    onChange={(e) => setNewReq({ ...newReq, label: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 rounded-2xl p-4 pr-32 text-xs font-bold focus:ring-2 focus:ring-rose-500 transition-all shadow-inner"
                                    required
                                />
                                <button type="submit" className="absolute right-2 top-2 bg-rose-500 hover:bg-rose-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20">
                                    Ajouter
                                </button>
                            </form>
                            <div className="space-y-2 max-h-[160px] overflow-y-auto no-scrollbar">
                                {requirements.map((req) => (
                                    <div key={req.id} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-50 dark:border-slate-800/50 group transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:scale-[1.02]">
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{req.label}</span>
                                        <button
                                            onClick={() => handleDeleteRequirement(req.id)}
                                            className="text-slate-300 hover:text-rose-500 p-1.5 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Addresses */}
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 p-8 space-y-6 text-slate-900 dark:text-slate-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black tracking-tighter flex items-center gap-3">
                                    <div className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl shadow-inner"><MapPin size={18} /></div>
                                    Adresses
                                </h2>
                                <button
                                    onClick={() => setShowAddAddress(!showAddAddress)}
                                    className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-amber-600 rounded-xl transition-all"
                                >
                                    {showAddAddress ? <X size={16} /> : <Plus size={16} />}
                                </button>
                            </div>

                            <AnimatePresence>
                                {showAddAddress && (
                                    <motion.form
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        onSubmit={handleAddAddress}
                                        className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-amber-100 dark:border-amber-900/40 space-y-4 mb-4"
                                    >
                                        <input
                                            type="text"
                                            placeholder="Libellé (ex: Siège)"
                                            value={newAddress.label}
                                            onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                                            className="w-full bg-white dark:bg-slate-900 border-none rounded-xl p-3 text-xs font-bold shadow-sm"
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Adresse complète"
                                            value={newAddress.formattedAddress}
                                            onChange={(e) => setNewAddress({ ...newAddress, formattedAddress: e.target.value })}
                                            className="w-full bg-white dark:bg-slate-900 border-none rounded-xl p-3 text-xs font-bold shadow-sm"
                                            required
                                        />
                                        <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white p-3 rounded-xl text-[10px] font-black tracking-widest uppercase">Enregistrer</button>
                                    </motion.form>
                                )}
                            </AnimatePresence>

                            <div className="space-y-3 max-h-[200px] overflow-y-auto no-scrollbar">
                                {addresses.map(addr => (
                                    <div key={addr.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${addr.isDefault
                                        ? 'border-amber-200 dark:border-amber-500/30 bg-amber-50/20 dark:bg-amber-500/5'
                                        : 'border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 group'
                                        }`}>
                                        <div className="flex gap-3">
                                            <div className={`p-2 rounded-lg ${addr.isDefault ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-white dark:bg-slate-800 text-slate-300'}`}><MapPin size={14} /></div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-black truncate">{addr.label}</span>
                                                <span className="text-[9px] font-bold text-slate-400 truncate tracking-tight">{addr.formattedAddress}</span>
                                            </div>
                                        </div>
                                        {!addr.isDefault && (
                                            <button onClick={() => handleSetDefault(addr.id!)} className="p-2 text-slate-200 hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-all"><Star size={14} /></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
