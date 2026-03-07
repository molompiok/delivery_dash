import React, { useState } from 'react';
import { Truck, ArrowLeft, Save, Loader2, Bike, Car, Truck as TruckIcon, Package, Bus, Info } from 'lucide-react';
import { fleetService } from '../../../api/fleet';
import { User } from '../../../api/types';

const VEHICLE_TYPES = [
    { id: 'BICYCLE', label: 'Vélo', icon: Bike, defaultWeight: 30, hasYear: false, hasEnergy: false, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'MOTO', label: 'Moto', icon: Bike, defaultWeight: 80, hasYear: true, hasEnergy: true, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'CAR_SEDAN', label: 'Berline', icon: Car, defaultWeight: 400, hasYear: true, hasEnergy: true, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: 'VAN', label: 'Van / Fourgon', icon: Package, defaultWeight: 1200, hasYear: true, hasEnergy: true, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'TRUCK', label: 'Camion', icon: TruckIcon, defaultWeight: 5000, hasYear: true, hasEnergy: true, color: 'text-rose-500', bg: 'bg-rose-50' },
];

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
    const [maxWeight, setMaxWeight] = useState('80');

    const selectedTypeInfo = VEHICLE_TYPES.find(t => t.id === type) || VEHICLE_TYPES[1];

    const handleTypeChange = (newType: string) => {
        const info = VEHICLE_TYPES.find(t => t.id === newType);
        if (info) {
            setType(newType);
            setMaxWeight(info.defaultWeight.toString());
            if (!info.hasYear) setYear('');
            if (!info.hasEnergy) setEnergy('GASOLINE'); // Default
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            let userStr = localStorage.getItem('delivery_user');
            if (!userStr) throw new Error('Utilisateur non connecté');
            let user: User = JSON.parse(userStr);

            if (!user.companyId) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const freshUserStr = localStorage.getItem('delivery_user');
                if (freshUserStr) {
                    user = JSON.parse(freshUserStr);
                }
            }

            if (!user.companyId) throw new Error('Aucune entreprise associée à votre compte.');

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
        <div className="max-w-4xl mx-auto pb-20">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <a href="/fleet" className="text-slate-400 hover:text-indigo-600 flex items-center mb-2 transition-colors text-xs font-black uppercase italic tracking-widest">
                        <ArrowLeft size={16} className="mr-2" /> Retour à la flotte
                    </a>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Nouveau Vaisseau</h1>
                    <p className="text-slate-500 font-medium">Enregistrez un nouvel actif dans votre matrice logistique.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                    <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm border border-rose-100 font-bold animate-in slide-in-from-top-4 duration-500">
                        {error}
                    </div>
                )}

                {/* Section 1: Vehicle Type Selection */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 border border-slate-100 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <TruckIcon size={120} />
                    </div>
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                        Phase 1 : Identification du Type
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {VEHICLE_TYPES.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => handleTypeChange(t.id)}
                                className={`flex flex-col items-center p-6 rounded-3xl border-2 transition-all duration-300 group ${type === t.id
                                        ? 'border-indigo-600 bg-indigo-50/50 scale-[1.02]'
                                        : 'border-slate-100 bg-white hover:border-slate-200 hover:scale-105'
                                    }`}
                            >
                                <div className={`p-4 rounded-2xl mb-4 transition-transform duration-500 group-hover:rotate-6 ${t.bg} ${t.color}`}>
                                    <t.icon size={32} />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${type === t.id ? 'text-indigo-600' : 'text-slate-400'}`}>
                                    {t.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section 2: Technical Specifications */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 border border-slate-100">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                        Phase 2 : Fiche Technique
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Marque</label>
                            <input
                                type="text"
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                                placeholder="ex: TOYOTA, HONDA..."
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-600 outline-none font-black text-slate-900 placeholder:text-slate-300 transition-all uppercase italic"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Modèle</label>
                            <input
                                type="text"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                placeholder="ex: COROLLA, LAND CRUISER..."
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-600 outline-none font-black text-slate-900 placeholder:text-slate-300 transition-all uppercase italic"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Immatriculation</label>
                            <input
                                type="text"
                                value={plate}
                                onChange={(e) => setPlate(e.target.value)}
                                placeholder="AB-123-CD"
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-600 outline-none font-black text-slate-900 placeholder:text-slate-300 transition-all uppercase italic"
                                required
                            />
                        </div>

                        {selectedTypeInfo.hasEnergy && (
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Énergie</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID'].map((e) => (
                                        <button
                                            key={e}
                                            type="button"
                                            onClick={() => setEnergy(e)}
                                            className={`px-4 py-3 rounded-2xl text-[10px] font-black transition-all ${energy === e
                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                                }`}
                                        >
                                            {e}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedTypeInfo.hasYear && (
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Année</label>
                                <input
                                    type="number"
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    placeholder="2024"
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-600 outline-none font-black text-slate-900 placeholder:text-slate-300 transition-all italic"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Poids Max (kg)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={maxWeight}
                                    onChange={(e) => setMaxWeight(e.target.value)}
                                    className="w-full px-6 py-4 rounded-2xl bg-indigo-50 border-none focus:ring-2 focus:ring-indigo-600 outline-none font-black text-indigo-600 transition-all italic"
                                    required
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-300 uppercase tracking-widest pointer-events-none">
                                    Capacité
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                                <Info size={10} /> Suggéré pour {selectedTypeInfo.label}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-8">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="group bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-5 rounded-[2rem] font-black flex items-center shadow-2xl shadow-indigo-200 transition-all disabled:opacity-50 hover:-translate-y-1 uppercase italic tracking-tighter"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin mr-3" />
                        ) : (
                            <Save size={20} className="mr-3 group-hover:rotate-12 transition-transform" />
                        )}
                        {isLoading ? 'Initialisation...' : 'Déployer dans la Flotte'}
                    </button>
                </div>
            </form>
        </div>
    );
}
