import React, { useEffect, useState } from 'react';
import { User as UserIcon, MapPin, Plus, Star, Trash2 } from 'lucide-react';
import { companyService } from '../../api/company';
import { User, Address } from '../../api/types';
import { useHeaderAutoHide } from '../../hooks/useHeaderAutoHide';

export default function Page() {
    useHeaderAutoHide();
    const [user, setUser] = useState<User | null>(null);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [requirements, setRequirements] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Address Form
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [newAddress, setNewAddress] = useState({ label: '', formattedAddress: '', lat: 5.34, lng: -4.02 });

    // Requirements Form
    const [newReq, setNewReq] = useState({ id: '', label: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const userStr = localStorage.getItem('delivery_user');
            if (userStr) {
                const u = JSON.parse(userStr);
                setUser(u);
                if (u.companyId) {
                    const [addrRes, reqRes] = await Promise.all([
                        companyService.getAddresses(u.companyId),
                        companyService.getRequirements()
                    ]);
                    setAddresses(addrRes.data);
                    setRequirements(reqRes.data || []);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
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
                isDefault: addresses.length === 0 // First one is default
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

    if (isLoading) return <div className="p-8 text-slate-600 dark:text-slate-400">Chargement...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 text-slate-900 dark:text-slate-100">
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Paramètres</h1>

            {/* Profile Section */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                        <UserIcon size={20} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    Profil Utilisateur
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-medium">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
                        <span className="block text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Nom Complet</span>
                        <span className="text-slate-900 dark:text-slate-100">{user?.fullName}</span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
                        <span className="block text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Email</span>
                        <span className="text-slate-900 dark:text-slate-100">{user?.email}</span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
                        <span className="block text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Téléphone</span>
                        <span className="text-slate-900 dark:text-slate-100">{user?.phone}</span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
                        <span className="block text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Rôle</span>
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-md text-[10px] font-black uppercase tracking-tighter">
                            {user?.role}
                        </span>
                    </div>
                </div>
            </div>

            {/* Document Requirements Section */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                        <Plus size={20} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    Documents Requis (Standards)
                </h2>

                <form onSubmit={handleAddRequirement} className="flex gap-4 mb-8">
                    <input
                        type="text"
                        placeholder="Ex: Assurance Marchandise"
                        value={newReq.label}
                        onChange={(e) => setNewReq({ ...newReq, label: e.target.value })}
                        className="flex-1 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-emerald-500 focus:border-emerald-500 dark:text-slate-100 transition-all"
                        required
                    />
                    <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20">
                        Ajouter
                    </button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {requirements.map((req) => (
                        <div key={req.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/50 group transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:border-emerald-100 dark:hover:border-emerald-900/50">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{req.label}</span>
                            <button
                                onClick={() => handleDeleteRequirement(req.id)}
                                className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {requirements.length === 0 && (
                        <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium italic tracking-tight">Aucun document spécifique défini. Les standards seront utilisés.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Address Section */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                            <MapPin size={20} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        Adresses de l'entreprise
                    </h2>
                    <button
                        onClick={() => setShowAddAddress(!showAddAddress)}
                        className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${showAddAddress
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                            : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                            }`}
                    >
                        {showAddAddress ? 'Annuler' : '+ Ajouter'}
                    </button>
                </div>

                {showAddAddress && (
                    <form onSubmit={handleAddAddress} className="mb-8 p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Libellé (ex: Siège, Dépôt)</label>
                                <input
                                    type="text"
                                    value={newAddress.label}
                                    onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 p-3 text-sm dark:text-slate-100 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Adresse complète</label>
                                <input
                                    type="text"
                                    value={newAddress.formattedAddress}
                                    onChange={(e) => setNewAddress({ ...newAddress, formattedAddress: e.target.value })}
                                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 p-3 text-sm dark:text-slate-100 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" className="bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest px-6 py-2.5 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20">
                            Enregistrer l'adresse
                        </button>
                    </form>
                )}

                <div className="space-y-4">
                    {addresses.map(addr => (
                        <div key={addr.id} className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${addr.isDefault
                            ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-500/5 shadow-sm'
                            : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}>
                            <div className="flex items-start gap-4">
                                <div className={`p-2.5 rounded-xl ${addr.isDefault ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-slate-900 dark:text-slate-100">{addr.label}</span>
                                        {addr.isDefault && (
                                            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                Par défaut
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{addr.formattedAddress}</div>
                                </div>
                            </div>
                            {!addr.isDefault && (
                                <button
                                    onClick={() => handleSetDefault(addr.id!)}
                                    className="text-slate-300 dark:text-slate-600 hover:text-emerald-500 dark:hover:text-emerald-400 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl transition-all"
                                    title="Définir par défaut"
                                >
                                    <Star size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                    {addresses.length === 0 && (
                        <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium italic tracking-tight">Aucune adresse enregistrée.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
