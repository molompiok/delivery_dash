import React, { useEffect, useState } from 'react';
import { Map as MapIcon, Plus } from 'lucide-react';
import { mockService, Zone } from '../../../api/mock';

export default function Page() {
    const [zones, setZones] = useState<Zone[]>([]);

    useEffect(() => {
        mockService.getZones().then(setZones);
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Zones de Livraison</h1>
                <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-emerald-700">
                    <Plus size={20} className="mr-2" /> Ajouter une Zone
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {zones.map(zone => (
                    <div key={zone.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div
                            className="h-40 bg-gray-100 relative"
                            style={{ backgroundColor: `${zone.color}20` }}
                        >
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                <MapIcon size={48} opacity={0.5} />
                            </div>
                            <div
                                className="absolute rounded-full border-4 opacity-50"
                                style={{
                                    borderColor: zone.color,
                                    width: '100px',
                                    height: '100px',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)'
                                }}
                            />
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-lg text-gray-900 mb-1 flex items-center">
                                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: zone.color }} />
                                {zone.name}
                            </h3>
                            <p className="text-gray-500 text-sm">
                                Rayon de <strong>{zone.radiusKm} km</strong> autour du centre.
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
