import React, { useEffect, useState } from 'react';
import { Users, Plus, Search, UserCheck, Clock, AlertTriangle } from 'lucide-react';
import { driverService } from '../../../api/drivers';
import { User, CompanyDriverSetting } from '../../../api/types';
import { EmptyState } from '../../../components/EmptyState';

export default function Page() {
    const [drivers, setDrivers] = useState<CompanyDriverSetting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [filters, setFilters] = useState({
        name: '',
        email: '',
        phone: '',
        status: ''
    });

    useEffect(() => {
        loadDrivers();
    }, [filters]);

    const loadDrivers = async () => {
        try {
            const response = await driverService.listDrivers(filters);
            setDrivers(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Impossible de charger les chauffeurs.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Mes Chauffeurs</h1>
                    <p className="text-gray-500 mt-1">Gérez votre équipe de livraison</p>
                </div>
                <a
                    href="/drivers/invite"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium flex items-center shadow-sm transition-colors"
                >
                    <Plus size={20} className="mr-2" />
                    Inviter un chauffeur
                </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Nom</label>
                    <input
                        type="text"
                        placeholder="Filtrer par nom..."
                        className="w-full text-sm p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        value={filters.name}
                        onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                    <input
                        type="text"
                        placeholder="Filtrer par email..."
                        className="w-full text-sm p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        value={filters.email}
                        onChange={(e) => setFilters({ ...filters, email: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Téléphone</label>
                    <input
                        type="text"
                        placeholder="Filtrer par téléphone..."
                        className="w-full text-sm p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        value={filters.phone}
                        onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
                    <select
                        className="w-full text-sm p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="">Tous</option>
                        <option value="ACCEPTED">Actif</option>
                        <option value="PENDING">En attente</option>
                        <option value="REJECTED">Refusé</option>
                    </select>
                </div>
                <div className="flex items-end">
                    <button
                        onClick={() => setFilters({ name: '', email: '', phone: '', status: '' })}
                        className="w-full text-sm p-2 text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                    >
                        Effacer
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-12 text-center text-gray-400">
                            <Clock className="animate-spin mx-auto mb-2" /> Chargement...
                        </div>
                    ) : error ? (
                        <div className="p-8">
                            <EmptyState
                                icon={AlertTriangle}
                                title="Erreur"
                                description={error}
                                variant="error"
                                action={{
                                    label: "Réessayer",
                                    onClick: loadDrivers
                                }}
                            />
                        </div>
                    ) : drivers.length === 0 ? (
                        <div className="p-8">
                            <EmptyState
                                icon={Users}
                                title="Aucun chauffeur"
                                description="Vous n'avez pas encore de chauffeurs dans votre équipe. Invitez-les par leur numéro de téléphone."
                                action={{
                                    label: "Inviter un chauffeur",
                                    href: "/drivers/invite",
                                    icon: Plus
                                }}
                            />
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                                    <th className="p-4 font-semibold">Nom</th>
                                    <th className="p-4 font-semibold">Téléphone</th>
                                    <th className="p-4 font-semibold">Statut</th>
                                    <th className="p-4 font-semibold">Rôle</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {drivers.map(setting => (
                                    <tr
                                        key={setting.driver.id}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => window.location.href = `/drivers/${setting.driver.id}`}
                                    >
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900">{setting.driver.fullName}</div>
                                            <div className="text-xs text-gray-400">{setting.driver.email}</div>
                                        </td>
                                        <td className="p-4 font-mono text-sm text-gray-600">{setting.driver.phone}</td>
                                        <td className="p-4">
                                            {(() => {
                                                switch (setting.status) {
                                                    case 'ACCEPTED':
                                                        return (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700">
                                                                <UserCheck size={14} className="mr-1" /> Actif
                                                            </span>
                                                        );
                                                    case 'REJECTED':
                                                        return (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700">
                                                                <AlertTriangle size={14} className="mr-1" /> Refusé
                                                            </span>
                                                        );
                                                    case 'PENDING':
                                                        return (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-50 text-yellow-700">
                                                                <Clock size={14} className="mr-1" /> En attente
                                                            </span>
                                                        );
                                                    default:
                                                        return (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-700">
                                                                {setting.status}
                                                            </span>
                                                        );
                                                }
                                            })()}
                                        </td>
                                        <td className="p-4 text-sm text-gray-500">
                                            CHAUFFEUR
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
