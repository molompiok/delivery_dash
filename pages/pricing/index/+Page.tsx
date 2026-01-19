import React, { useEffect, useState } from 'react';
import { BadgeDollarSign, Plus, Check } from 'lucide-react';
import { mockService, PricingRule } from '../../../api/mock';

export default function Page() {
    const [rules, setRules] = useState<PricingRule[]>([]);

    useEffect(() => {
        mockService.getPricingRules().then(setRules);
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Tarification</h1>
                <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-emerald-700">
                    <Plus size={20} className="mr-2" /> Nouvelle Règle
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rules.map(rule => (
                    <div key={rule.id} className={`bg-white p-6 rounded-xl shadow-sm border-2 transition-all ${rule.active ? 'border-emerald-500 ring-4 ring-emerald-50' : 'border-gray-200'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-lg text-gray-900">{rule.name}</h3>
                            {rule.active && <Check className="text-emerald-500" />}
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Prix de base</span>
                                <span className="font-mono font-medium">{rule.basePrice} FCFA</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Par Km</span>
                                <span className="font-mono font-medium">{rule.perKmSurcharge} FCFA</span>
                            </div>
                        </div>
                        <div className="mt-6">
                            <button className={`w-full py-2 rounded-lg font-medium ${rule.active
                                ? 'bg-emerald-100 text-emerald-700 cursor-default'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}>
                                {rule.active ? 'Actif' : 'Activer'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
