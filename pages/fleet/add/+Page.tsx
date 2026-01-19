import React, { useState } from 'react';
import { Truck, ArrowLeft, Save, Loader2 } from 'lucide-react';
import { fleetService } from '../../../api/fleet';
import { User } from '../../../api/types';

export default function Page() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Form State
    const [type, setType] = useState('MOTO');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [plate, setPlate] = useState('');
    const [energy, setEnergy] = useState('GASOLINE');
    const [year, setYear] = useState('');
    const [maxWeight, setMaxWeight] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            let userStr = localStorage.getItem('delivery_user');
            if (!userStr) throw new Error('Utilisateur non connecté');
            let user: User = JSON.parse(userStr);

            // Wait for Layout pulse if companyId is missing
            if (!user.companyId) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const freshUserStr = localStorage.getItem('delivery_user');
                if (freshUserStr) {
                    user = JSON.parse(freshUserStr);
                }
            }

            if (!user.companyId) throw new Error('Aucune entreprise associée à votre compte pour le moment. Veuillez patienter ou rafraîchir la page.');

            await fleetService.createVehicle(user.companyId, {
                type: type as any,
                brand,
                model,
                plate,
                energy: energy as any,
                year: year ? parseInt(year) : undefined,
                specs: maxWeight ? { maxWeight: parseFloat(maxWeight) } : null
            });

            window.location.href = '/fleet';
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la création');
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <a href="/fleet" className="text-gray-500 hover:text-gray-700 flex items-center mb-2">
                    <ArrowLeft size={16} className="mr-1" /> Retour à la liste
                </a>
                <h1 className="text-2xl font-bold text-gray-800">Ajouter un véhicule</h1>
                <p className="text-gray-500">Enregistrez un nouveau véhicule dans votre flotte.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type de véhicule</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="MOTO">Moto</option>
                                <option value="CAR_SEDAN">Voiture (Berline)</option>
                                <option value="VAN">Fourgon / Van</option>
                                <option value="TRUCK">Camion</option>
                                <option value="BICYCLE">Vélo</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Énergie</label>
                            <select
                                value={energy}
                                onChange={(e) => setEnergy(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="GASOLINE">Essence</option>
                                <option value="DIESEL">Diesel</option>
                                <option value="ELECTRIC">Électrique</option>
                                <option value="HYBRID">Hybride</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Marque</label>
                            <input
                                type="text"
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                                placeholder="Ex: Toyota"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Modèle</label>
                            <input
                                type="text"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                placeholder="Ex: Corolla"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Immatriculation</label>
                            <input
                                type="text"
                                value={plate}
                                onChange={(e) => setPlate(e.target.value)}
                                placeholder="AB-123-CD"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none uppercase"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
                            <input
                                type="number"
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                placeholder="2023"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center">
                            <Truck size={16} className="mr-2 text-emerald-600" />
                            Capacités & Dimensions
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Poids Maximum (kg)</label>
                                <input
                                    type="number"
                                    value={maxWeight}
                                    onChange={(e) => setMaxWeight(e.target.value)}
                                    placeholder="Ex: 800"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                                <p className="text-xs text-gray-400 mt-1">Capacité de charge utile du véhicule.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium flex items-center shadow-sm transition-colors disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                            {isLoading ? 'Enregistrement...' : 'Enregistrer le véhicule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
