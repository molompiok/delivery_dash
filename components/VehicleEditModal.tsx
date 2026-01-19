import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Vehicle } from '../api/types';
import { fleetService } from '../api/fleet';

interface VehicleEditModalProps {
    vehicle: Vehicle;
    onClose: () => void;
    onUpdate: (updatedVehicle: Vehicle) => void;
}

export function VehicleEditModal({ vehicle, onClose, onUpdate }: VehicleEditModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        brand: vehicle.brand,
        model: vehicle.model,
        plate: vehicle.plate,
        year: vehicle.year || new Date().getFullYear(),
        color: vehicle.color || '',
        energy: vehicle.energy,
        specs: {
            maxWeight: vehicle.specs?.maxWeight || 0,
            cargoVolume: vehicle.specs?.cargoVolume || 0,
            length: vehicle.specs?.length || 0,
            width: vehicle.specs?.width || 0,
            height: vehicle.specs?.height || 0,
        }
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('specs.')) {
            const specKey = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                specs: {
                    ...prev.specs,
                    [specKey]: Number(value)
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: name === 'year' ? Number(value) : value
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const payload = {
                ...vehicle,
                ...formData,
                // Ensure correct types are sent back
                year: Number(formData.year),
            };

            const response = await fleetService.updateVehicle(vehicle.id, payload);
            onUpdate(response.data);
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900">Modifier le Véhicule</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center text-sm">
                            <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Marque</label>
                            <input
                                name="brand"
                                value={formData.brand}
                                onChange={handleChange}
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Modèle</label>
                            <input
                                name="model"
                                value={formData.model}
                                onChange={handleChange}
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Immatriculation</label>
                            <input
                                name="plate"
                                value={formData.plate}
                                onChange={handleChange}
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Année</label>
                            <input
                                type="number"
                                name="year"
                                value={formData.year}
                                onChange={handleChange}
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-4">Caractéristiques Techniques (Optionnel)</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-500">Poids Max (kg)</label>
                                <input
                                    type="number"
                                    name="specs.maxWeight"
                                    value={formData.specs.maxWeight}
                                    onChange={handleChange}
                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-500">Volume (m³)</label>
                                <input
                                    type="number"
                                    name="specs.cargoVolume"
                                    value={formData.specs.cargoVolume}
                                    onChange={handleChange}
                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                                />
                            </div>
                            {/* Dimensions can differ based on vehicle type, keeping simple for now */}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-all flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Enregistrement...' : (
                                <>
                                    <Save size={18} className="mr-2" /> Note
                                </>
                            )}
                            Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
