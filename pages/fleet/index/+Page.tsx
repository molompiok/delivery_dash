import React, { useEffect, useState } from 'react';
import { Truck, Plus, Search, AlertCircle, CheckCircle, Clock, Building2, ChevronRight } from 'lucide-react';
import { fleetService } from '../../../api/fleet';
import { Vehicle, User } from '../../../api/types';
import { EmptyState } from '../../../components/EmptyState';

const VEHICLE_TYPE_LABELS: Record<string, string> = {
    'MOTO': 'Moto',
    'CAR_SEDAN': 'Voiture',
    'VAN': 'Utilitaire',
    'TRUCK': 'Poids Lourd',
    'BICYCLE': 'Vélo'
};

export default function Page() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [companyMissing, setCompanyMissing] = useState(false);

    useEffect(() => {
        loadVehicles();
    }, []);

    const loadVehicles = async () => {
        try {
            const userStr = localStorage.getItem('delivery_user');
            if (!userStr) {
                setIsLoading(false);
                return;
            }
            let user: User = JSON.parse(userStr);

            // If companyId is missing, wait a bit to see if Layout syncs it, 
            // or we could try to fetch profile here too but Layout already does it.
            // Let's do a quick local retry if companyId is null
            if (!user.companyId) {
                // Wait 1 second for pulse
                await new Promise(resolve => setTimeout(resolve, 1000));
                const freshUserStr = localStorage.getItem('delivery_user');
                if (freshUserStr) {
                    user = JSON.parse(freshUserStr);
                }
            }

            if (!user.companyId) {
                setCompanyMissing(true);
                setIsLoading(false);
                return;
            }

            const response = await fleetService.listVehicles(user.companyId);
            setVehicles(response.data);
            setCompanyMissing(false);
        } catch (err) {
            setError('Impossible de charger les véhicules.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredVehicles = vehicles.filter(v =>
        v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20 text-gray-400">
                <Clock className="animate-spin mr-2" /> Chargement de vos véhicules...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Mes Véhicules</h1>
                    <p className="text-gray-500 mt-1">Gérez vos véhicules et leur état</p>
                </div>
                {!companyMissing && (
                    <a
                        href="/fleet/add"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium flex items-center shadow-sm transition-colors"
                    >
                        <Plus size={20} className="mr-2" />
                        Ajouter un véhicule
                    </a>
                )}
            </div>

            {companyMissing ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <EmptyState
                        icon={Building2}
                        title="Aucune entreprise associée"
                        description="Vous devez être associé à une entreprise pour gérer une flotte de véhicules."
                        variant="warning"
                        action={{
                            label: "Réessayer",
                            onClick: () => {
                                setIsLoading(true);
                                loadVehicles();
                            },
                        }}
                    />
                </div>
            ) : error ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <EmptyState
                        icon={AlertCircle}
                        title="Erreur de chargement"
                        description={error}
                        variant="error"
                        action={{
                            label: "Réessayer",
                            onClick: () => {
                                setIsLoading(true);
                                loadVehicles();
                            },
                        }}
                    />
                </div>
            ) : filteredVehicles.length === 0 && !searchTerm ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <EmptyState
                        icon={Truck}
                        title="Aucun véhicule trouvé"
                        description="Commencez par ajouter votre premier véhicule pour gérer vos livraisons."
                        action={{
                            label: "Ajouter un véhicule",
                            href: "/fleet/add",
                            icon: Plus
                        }}
                    />
                </div>
            ) : (
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                            <th className="p-4 font-semibold">Véhicule</th>
                            <th className="p-4 font-semibold">Type</th>
                            <th className="p-4 font-semibold">Plaque</th>
                            <th className="p-4 font-semibold">Chauffeur</th>
                            <th className="p-4 font-semibold">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredVehicles.map(vehicle => (
                            <tr key={vehicle.id}
                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => window.location.href = `/fleet/${vehicle.id}`}
                            >
                                <td className="p-4">
                                    <div className="font-medium text-gray-900">{vehicle.brand} {vehicle.model}</div>
                                    <div className="text-xs text-gray-400">{vehicle.year}</div>
                                </td>
                                <td className="p-4">
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                                        {VEHICLE_TYPE_LABELS[vehicle.type] || vehicle.type}
                                    </span>
                                </td>
                                <td className="p-4 font-mono text-sm text-gray-600">{vehicle.plate}</td>
                                <td className="p-4">
                                    {vehicle.assignedDriver ? (
                                        <div className="flex items-center">
                                            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold mr-2">
                                                {vehicle.assignedDriver.fullName.charAt(0)}
                                            </div>
                                            <span className="text-sm text-gray-700">{vehicle.assignedDriver.fullName}</span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-400 italic">Non assigné</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    {vehicle.verificationStatus === 'APPROVED' && (
                                        <span className="inline-flex items-center text-xs font-medium text-emerald-600">
                                            <CheckCircle size={14} className="mr-1" /> Vérifié
                                        </span>
                                    )}
                                    {vehicle.verificationStatus === 'PENDING' && (
                                        <span className="inline-flex items-center text-xs font-medium text-amber-600">
                                            <Clock size={14} className="mr-1" /> En attente
                                        </span>
                                    )}
                                    {vehicle.verificationStatus === 'REJECTED' && (
                                        <span className="inline-flex items-center text-xs font-medium text-red-600">
                                            <AlertCircle size={14} className="mr-1" /> Rejeté
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
