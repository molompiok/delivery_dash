import React, { useEffect, useState } from 'react';
import { User, MapPin, Plus, Star, Trash2 } from 'lucide-react';
import { companyService } from '../../api/company';
import { Address, User as UserType } from '../../api/types';

export default function Page() {
    const [user, setUser] = useState<UserType | null>(null);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Address Form
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [newAddress, setNewAddress] = useState({ label: '', formattedAddress: '', lat: 5.34, lng: -4.02 });

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
                    const res = await companyService.getAddresses(u.companyId);
                    setAddresses(res.data);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
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
