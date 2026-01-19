import React, { useEffect, useState } from 'react';
import { usePageContext } from 'vike-react/usePageContext';
import { User, Truck, MapPin, Package, FileText, Calendar, Clock, AlertTriangle, UserCheck, ArrowLeft, ExternalLink, Briefcase, Plane, Coffee, Users, ChevronRight, Briefcase as BriefcaseIcon, Send } from 'lucide-react';
import { driverService } from '../../../api/drivers';
import { EmptyState } from '../../../components/EmptyState';
import { ConfirmModal } from '../../../components/ConfirmModal';

export default function Page() {
    const pageContext = usePageContext();
    const driverId = pageContext.routeParams?.id;

    const [driverData, setDriverData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'INFO' | 'ASSIGNMENTS' | 'ORDERS' | 'DOCS'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('driver_detail_tab') as any) || 'INFO';
        }
        return 'INFO';
    });

    const [showInviteConfirm, setShowInviteConfirm] = useState(false);
    const [invitationError, setInvitationError] = useState('');
    const [validationError, setValidationError] = useState('');
    const [isInviting, setIsInviting] = useState(false);

    const handleTabChange = (tab: typeof activeTab) => {
        setActiveTab(tab);
        localStorage.setItem('driver_detail_tab', tab);
        setInvitationError('');
    };

    useEffect(() => {
        if (driverId) loadDriver();
    }, [driverId]);

    const loadDriver = async () => {
        try {
            const response = await driverService.getDriver(driverId);
            setDriverData(response.data);
            setInvitationError('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Impossible de charger les détails du chauffeur.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInviteToFleet = async () => {
        setIsInviting(true);
        setInvitationError('');
        try {
            await driverService.inviteToFleet(driver.id);
            await loadDriver();
            setShowInviteConfirm(false);
        } catch (err: any) {
            setInvitationError(err.response?.data?.message || 'Erreur lors de l\'envoi de l\'invitation.');
        } finally {
            setIsInviting(false);
        }
    };

    if (isLoading) return <div className="p-12 text-center text-gray-400">Chargement des informations...</div>;
    if (error) return <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg">{error}</div>;
    if (!driverData) return null;

    const { driver, currentVehicle, recentOrders, assignedSchedules, assignedZones } = driverData;

    const getIconComponent = (iconName?: string) => {
        const iconMap: Record<string, any> = {
            'Briefcase': BriefcaseIcon,
            'Calendar': Calendar,
            'Plane': Plane,
            'Coffee': Coffee,
            'Users': Users,
            'Clock': Clock,
        };
        return iconMap[iconName || ''] || Calendar;
    };

    const formatRecurrence = (schedule: any) => {
        if (schedule.recurrenceType === 'WEEKLY') {
            const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
            return `Chaque ${days[schedule.dayOfWeek]}`;
        }
        if (schedule.recurrenceType === 'DATE_RANGE') {
            return `Du ${new Date(schedule.startDate).toLocaleDateString()} au ${new Date(schedule.endDate).toLocaleDateString()}`;
        }
        if (schedule.recurrenceType === 'SPECIFIC_DATE') {
            return `Le ${new Date(schedule.specificDate).toLocaleDateString()}`;
        }
        return '';
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <a href="/drivers" className="text-gray-500 hover:text-gray-700 flex items-center mb-4 text-sm transition-colors w-fit">
                    <ArrowLeft size={16} className="mr-1" /> Retour liste
                </a>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-2xl font-bold">
                            {driver.fullName?.charAt(0) || '?'}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{driver.fullName}</h1>
                            <div className="text-sm text-gray-500 flex items-center gap-3">
                                <span>{driver.phone}</span>
                                <span>•</span>
                                <span>{driver.email}</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        {driverData.status === 'ACCEPTED' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                <UserCheck size={16} className="mr-2" /> Actif
                            </span>
                        ) : driverData.status === 'REJECTED' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                <AlertTriangle size={16} className="mr-2" /> Refusé
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                <Clock size={16} className="mr-2" /> En attente
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
                <div className="flex border-b border-gray-200 overflow-x-auto">
                    {[
                        { id: 'INFO', label: 'Informations', icon: User },
                        { id: 'ASSIGNMENTS', label: 'Assignation', icon: Calendar }, // Using Calendar as icon for assignments generally
                        { id: 'ORDERS', label: 'Commandes', icon: Package },
                        { id: 'DOCS', label: 'Documents', icon: FileText },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id as any)}
                            className={`flex items-center px-6 py-4 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id
                                ? 'border-emerald-500 text-emerald-600 bg-emerald-50/30'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <tab.icon size={16} className="mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {/* INFO TAB */}
                    {activeTab === 'INFO' && (
                        <div className="max-w-2xl animate-in fade-in duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900">Détails du profil</h3>
                                {driverData.status === 'ACCEPTED' && (
                                    <a
                                        href={`/map?driver_id=${driver.id}`}
                                        className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold border border-blue-100 hover:bg-blue-100 transition-all shadow-sm group"
                                    >
                                        <MapPin size={16} className="mr-2 group-hover:scale-110 transition-transform" />
                                        Voir en direct
                                    </a>
                                )}
                            </div>
                            <dl className="grid grid-cols-1 gap-y-4">
                                <div className="border-b border-gray-100 pb-4">
                                    <dt className="text-sm font-medium text-gray-500">Nom Complet</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{driver.fullName}</dd>
                                </div>
                                <div className="border-b border-gray-100 pb-4">
                                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{driver.email || '-'}</dd>
                                </div>
                                <div className="border-b border-gray-100 pb-4">
                                    <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
                                    <dd className="mt-1 text-sm text-gray-900 font-mono">{driver.phone}</dd>
                                </div>
                                <div className="border-b border-gray-100 pb-4">
                                    <dt className="text-sm font-medium text-gray-500">Rejoint le</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {driverData.acceptedAt ? new Date(driverData.acceptedAt).toLocaleDateString() : 'Invitation en attente'}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    )}

                    {/* ASSIGNMENTS TAB */}
                    {activeTab === 'ASSIGNMENTS' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {/* Vehicle */}
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200/60">
                                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center uppercase tracking-wider text-gray-500">
                                    <Truck size={16} className="mr-2" /> Véhicule Actuel
                                </h3>
                                {currentVehicle ? (
                                    <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
                                        <div>
                                            <h4 className="font-bold text-gray-900">{currentVehicle.brand} {currentVehicle.model}</h4>
                                            <p className="text-sm text-gray-500 font-mono mt-1">{currentVehicle.plate}</p>
                                        </div>
                                        <a href={`/fleet/${currentVehicle.id}`} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center">
                                            Voir détail <ExternalLink size={14} className="ml-1" />
                                        </a>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">Aucun véhicule assigné actuellement.</p>
                                )}
                            </div>

                            {/* Schedule & Zone */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200/60 transition-all">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-gray-900 flex items-center uppercase tracking-wider text-gray-500">
                                            <Calendar size={16} className="mr-2" /> Horaires Assignés
                                        </h3>
                                        <a href="/schedules" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full transition-colors">
                                            Voir le planning <ChevronRight size={12} />
                                        </a>
                                    </div>

                                    {assignedSchedules && assignedSchedules.length > 0 ? (
                                        <div className="space-y-3">
                                            {assignedSchedules.map((schedule: any) => {
                                                const Icon = getIconComponent(schedule.icon);
                                                return (
                                                    <div key={schedule.id} className="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-100 shadow-sm hover:border-emerald-100 transition-colors">
                                                        <div
                                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                                                            style={{ backgroundColor: schedule.color || '#10b981' }}
                                                        >
                                                            <Icon size={20} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-bold text-gray-900 truncate">{schedule.title || 'Horaire'}</h4>
                                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar size={12} /> {formatRecurrence(schedule)}
                                                                </span>
                                                                <span>•</span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock size={12} /> {schedule.startTime} - {schedule.endTime}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 bg-white rounded-lg border border-dashed border-gray-200">
                                            <p className="text-sm text-gray-400 italic">Aucun horaire assigné pour le moment.</p>
                                        </div>
                                    )}
                                </div>
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200/60">
                                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center uppercase tracking-wider text-gray-500">
                                        <MapPin size={16} className="mr-2" /> Zones d'intervention
                                    </h3>
                                    {assignedZones && assignedZones.length > 0 ? (
                                        <div className="space-y-6">
                                            {Object.entries(
                                                assignedZones.reduce((acc: any, zone: any) => {
                                                    const sector = zone.sector || 'NON CLASSÉ';
                                                    if (!acc[sector]) acc[sector] = [];
                                                    acc[sector].push(zone);
                                                    return acc;
                                                }, {})
                                            ).map(([sector, zones]: [string, any]) => (
                                                <div key={sector}>
                                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                                                        {sector}
                                                    </h4>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {zones.map((zone: any) => (
                                                            <a
                                                                key={zone.id}
                                                                href={`/map?zone_id=${zone.id}`}
                                                                className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all group"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div
                                                                        className="w-2 h-2 rounded-full"
                                                                        style={{ backgroundColor: zone.color }}
                                                                    />
                                                                    <span className="text-sm font-bold text-gray-700">{zone.name}</span>
                                                                </div>
                                                                <ChevronRight size={14} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">Aucune zone assignée.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ORDERS TAB */}
                    {activeTab === 'ORDERS' && (
                        <div className="animate-in fade-in duration-300">
                            {recentOrders && recentOrders.length > 0 ? (
                                <>
                                    <div className="overflow-hidden border border-gray-200 rounded-lg mb-4">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ref</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trajet</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {recentOrders.map((order: any) => (
                                                    <tr key={order.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {new Date(order.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            #{order.id.slice(-6)}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">
                                                            <div className="flex flex-col">
                                                                <span className="truncate max-w-[200px]" title={order.pickupAddress?.formattedAddress}>{order.pickupAddress?.formattedAddress || 'N/A'}</span>
                                                                <span className="text-xs text-gray-400">vers</span>
                                                                <span className="truncate max-w-[200px]" title={order.deliveryAddress?.formattedAddress}>{order.deliveryAddress?.formattedAddress || 'N/A'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                                                order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                                    'bg-blue-100 text-blue-800'
                                                                }`}>
                                                                {order.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="text-center">
                                        <a href={`/orders?driverId=${driver.id}`} className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium">
                                            Voir toutes les commandes <ExternalLink size={16} className="ml-1" />
                                        </a>
                                    </div>
                                </>
                            ) : (
                                <EmptyState
                                    icon={Package}
                                    title="Aucune course récente"
                                    description="Ce chauffeur n'a pas encore effectué de courses."
                                    action={{
                                        label: "Voir toutes les commandes",
                                        href: `/orders?driverId=${driver.id}`,
                                        icon: ExternalLink
                                    }}
                                />
                            )}
                        </div>
                    )}

                    {/* DOCS TAB */}
                    {activeTab === 'DOCS' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {/* Summary Header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50 p-6 rounded-xl border border-gray-200/60 transition-all">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Processus de Conformité</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {driverData.status === 'PENDING_ACCESS' ? "En attente d'accès aux données du chauffeur." :
                                            driverData.status === 'ACCESS_ACCEPTED' ? (
                                                driverData.docsStatus === 'APPROVED'
                                                    ? "Documents validés. Vous pouvez maintenant inviter le chauffeur."
                                                    : "Vérification des documents en cours."
                                            ) :
                                                driverData.status === 'PENDING_FLEET' ? "Invitation finale envoyée. En attente du chauffeur." :
                                                    "Conformité terminée."}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {driverData.status === 'ACCESS_ACCEPTED' && (
                                        <>
                                            {driverData.docsStatus === 'APPROVED' ? (
                                                <button
                                                    onClick={() => setShowInviteConfirm(true)}
                                                    className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
                                                >
                                                    <Send size={18} className="mr-2" /> Inviter dans la Flotte
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold border border-amber-100">
                                                    <AlertTriangle size={14} /> Validation requise
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {driverData.status === 'PENDING_FLEET' && (
                                        <div className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold border border-blue-100 italic transition-all animate-pulse">
                                            <Clock size={18} /> Invitation en cours...
                                        </div>
                                    )}

                                    {driverData.status === 'ACCEPTED' && (
                                        <div className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold border border-emerald-100">
                                            <UserCheck size={18} /> Intégré à la flotte
                                        </div>
                                    )}
                                </div>
                            </div>

                            {invitationError && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-medium flex items-center gap-3 animate-in slide-in-from-top-2">
                                    <AlertTriangle size={18} /> {invitationError}
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Required Documents Config (Selection) */}
                                <div className="lg:col-span-1 space-y-4">
                                    <div className="flex items-center gap-2 mb-2 px-1">
                                        <FileText size={18} className="text-emerald-600" />
                                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Documents Requis</h4>
                                    </div>
                                    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                                        {[
                                            { id: 'dct_licence', name: 'Permis de Conduire' },
                                            { id: 'dct_identity', name: 'CNI / Passeport' },
                                            { id: 'dct_insurance', name: 'Assurance Véhicule' },
                                            { id: 'dct_criminal_record', name: 'Casier Judiciaire' }
                                        ].map(type => {
                                            const isSelected = driverData.requiredDocTypes?.includes(type.id);
                                            return (
                                                <label
                                                    key={type.id}
                                                    className={`flex items-center gap-3 p-4 border-b border-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50/30' : 'hover:bg-gray-50'}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={async (e) => {
                                                            const current = driverData.requiredDocTypes || [];
                                                            const next = e.target.checked
                                                                ? [...current, type.id]
                                                                : current.filter((id: string) => id !== type.id);
                                                            try {
                                                                await driverService.setRequiredDocs(driver.id, next);
                                                                loadDriver();
                                                            } catch (err) {
                                                                alert('Erreur lors de la mise à jour');
                                                            }
                                                        }}
                                                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                                    />
                                                    <span className={`text-sm ${isSelected ? 'font-bold text-emerald-900' : 'text-gray-600'}`}>
                                                        {type.name}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[11px] text-gray-400 px-2 italic">
                                        Sélectionnez les documents que le chauffeur doit obligatoirement fournir et valider.
                                    </p>
                                </div>

                                {/* Review Section */}
                                <div className="lg:col-span-2 space-y-4">
                                    <div className="flex items-center gap-2 mb-2 px-1">
                                        <UserCheck size={18} className="text-blue-600" />
                                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Dossier de Candidature</h4>
                                    </div>

                                    {validationError && (
                                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-1">
                                            <AlertTriangle size={14} /> {validationError}
                                        </div>
                                    )}

                                    {driverData.status === 'PENDING_ACCESS' ? (
                                        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-8 text-center">
                                            <Clock size={40} className="mx-auto text-yellow-500 mb-4 animate-pulse" />
                                            <h5 className="font-bold text-yellow-900">En attente d'accès</h5>
                                            <p className="text-sm text-yellow-700 mt-2">
                                                Le chauffeur doit accepter votre demande d'accès pour que ses documents apparaissent ici.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {(driverData.documents || []).length === 0 && (
                                                <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                    <p className="text-gray-400">Aucun document requis pour le moment.</p>
                                                </div>
                                            )}
                                            {(driverData.documents || []).map((doc: any) => {
                                                const file = doc.file;

                                                return (
                                                    <div key={doc.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm group hover:border-emerald-200 transition-all">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div>
                                                                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                                    {doc.documentType.replace('_', ' ')}
                                                                </h5>
                                                            </div>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${doc.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                                doc.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                                    'bg-blue-100 text-blue-700'
                                                                }`}>
                                                                {doc.status}
                                                            </span>
                                                        </div>

                                                        {file ? (
                                                            <div className="space-y-4">
                                                                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border border-gray-100 overflow-hidden relative group/img">
                                                                    {file.mimeType?.startsWith('image/') || file.mimeType === 'text/plain' ? (
                                                                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                                                                            <FileText size={32} className="text-emerald-500 mb-2" />
                                                                            <span className="text-[10px] text-gray-400 px-4 text-center truncate w-full">{file.name}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <FileText size={32} className="text-gray-300" />
                                                                    )}
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                                        <button onClick={() => window.open(`/api/v1/files/${file.id}/view`, '_blank')} className="p-2 bg-white rounded-full text-gray-900 shadow-xl">
                                                                            <ExternalLink size={18} />
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={async () => {
                                                                            setValidationError('');
                                                                            try {
                                                                                await driverService.validateDocument(doc.id, 'APPROVED');
                                                                                loadDriver();
                                                                            } catch (err: any) { setValidationError(err.response?.data?.message || 'Erreur lors de la validation'); }
                                                                        }}
                                                                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${doc.status === 'APPROVED'
                                                                            ? 'bg-green-600 text-white shadow-md shadow-green-100'
                                                                            : 'bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-700 border border-gray-100'
                                                                            }`}
                                                                    >
                                                                        <UserCheck size={14} /> Valider
                                                                    </button>
                                                                    <button
                                                                        onClick={async () => {
                                                                            setValidationError('');
                                                                            const reason = prompt('Motif du rejet ?');
                                                                            if (reason) {
                                                                                try {
                                                                                    await driverService.validateDocument(doc.id, 'REJECTED', reason);
                                                                                    loadDriver();
                                                                                } catch (err: any) { setValidationError(err.response?.data?.message || 'Erreur lors du rejet'); }
                                                                            }
                                                                        }}
                                                                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${doc.status === 'REJECTED'
                                                                            ? 'bg-red-600 text-white shadow-md shadow-red-100'
                                                                            : 'bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-700 border border-gray-100'
                                                                            }`}
                                                                    >
                                                                        <AlertTriangle size={14} /> Rejeter
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-lg">
                                                                <p className="text-xs text-gray-400">En attente d'envoi</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Invitation Confirmation Modal */}
            <ConfirmModal
                isOpen={showInviteConfirm}
                onClose={() => setShowInviteConfirm(false)}
                onConfirm={handleInviteToFleet}
                title="Confirmer l'invitation"
                description={`Voulez-vous envoyer l'invitation finale à ${driver.fullName} pour rejoindre votre flotte ? Le chauffeur devra accepter l'invitation pour devenir actif.`}
                confirmLabel={isInviting ? "Envoi..." : "Envoyer l'invitation"}
                confirmVariant="primary"
            />
        </div>
    );
}
