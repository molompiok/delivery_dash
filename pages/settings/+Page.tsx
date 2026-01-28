import React, { useEffect, useState } from 'react';
import { User, MapPin, Plus, Star, Trash2 } from 'lucide-react';
import { companyService } from '../../api/company';
import { Address, User as UserType } from '../../api/types';

export default function Page() {
    const [user, setUser] = useState<UserType | null>(null);
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

    if (isLoading) return <div className="p-8">Chargement...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-gray-800">Paramètres</h1>

            {/* Profile Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <User size={20} className="mr-2 text-emerald-600" /> Profil Utilisateur
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="block text-gray-500 text-xs mb-1">Nom Complet</span>
                        <span className="font-medium text-gray-900">{user?.fullName}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="block text-gray-500 text-xs mb-1">Email</span>
                        <span className="font-medium text-gray-900">{user?.email}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="block text-gray-500 text-xs mb-1">Téléphone</span>
                        <span className="font-medium text-gray-900">{user?.phone}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="block text-gray-500 text-xs mb-1">Rôle</span>
                        <span className="font-medium text-gray-900">{user?.role}</span>
                    </div>
                </div>
            </div>

            {/* Document Requirements Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                    <Plus size={20} className="mr-2 text-emerald-600" /> Documents Requis (Standards)
                </h2>

                <form onSubmit={handleAddRequirement} className="flex gap-4 mb-6">
                    <input
                        type="text"
                        placeholder="Ex: Assurance Marchandise"
                        value={newReq.label}
                        onChange={(e) => setNewReq({ ...newReq, label: e.target.value })}
                        className="flex-1 rounded-lg border-gray-300 text-sm shadow-sm"
                        required
                    />
                    <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
                        Ajouter
                    </button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {requirements.map((req) => (
                        <div key={req.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 group">
                            <span className="text-sm font-medium text-gray-700">{req.label}</span>
                            <button
                                onClick={() => handleDeleteRequirement(req.id)}
                                className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {requirements.length === 0 && (
                        <div className="col-span-full py-8 text-center bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                            <p className="text-sm text-gray-400 italic">Aucun document spécifique défini. Les standards seront utilisés.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Address Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                        <MapPin size={20} className="mr-2 text-emerald-600" /> Adresses de l'entreprise
                    </h2>
                    <button
                        onClick={() => setShowAddAddress(!showAddAddress)}
                        className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
                    >
                        {showAddAddress ? 'Annuler' : '+ Ajouter'}
                    </button>
                </div>

                {showAddAddress && (
                    <form onSubmit={handleAddAddress} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Libellé (ex: Siège, Dépôt)</label>
                                <input
                                    type="text"
                                    value={newAddress.label}
                                    onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                                    className="w-full rounded-md border-gray-300 p-2 text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Adresse complète</label>
                                <input
                                    type="text"
                                    value={newAddress.formattedAddress}
                                    onChange={(e) => setNewAddress({ ...newAddress, formattedAddress: e.target.value })}
                                    className="w-full rounded-md border-gray-300 p-2 text-sm"
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" className="bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg font-medium">
                            Enregistrer
                        </button>
                    </form>
                )}

                <div className="space-y-3">
                    {addresses.map(addr => (
                        <div key={addr.id} className={`flex items-center justify-between p-4 rounded-lg border ${addr.isDefault ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100'}`}>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">{addr.label}</span>
                                    {addr.isDefault && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Par défaut</span>}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">{addr.formattedAddress}</div>
                            </div>
                            {!addr.isDefault && (
                                <button
                                    onClick={() => handleSetDefault(addr.id!)}
                                    className="text-gray-400 hover:text-yellow-500 p-2"
                                    title="Définir par défaut"
                                >
                                    <Star size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                    {addresses.length === 0 && (
                        <p className="text-center text-gray-400 py-4 italic">Aucune adresse enregistrée.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
