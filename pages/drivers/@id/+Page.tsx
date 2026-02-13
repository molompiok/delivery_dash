import React, { useEffect, useState } from 'react';
import { usePageContext } from 'vike-react/usePageContext';
import { User, Truck, MapPin, Package, FileText, Calendar, Clock, AlertTriangle, UserCheck, ArrowLeft, ExternalLink, Briefcase, Plane, Coffee, Users, ChevronRight, Briefcase as BriefcaseIcon, Send, TrendingUp, Star } from 'lucide-react';
import { driverService } from '../../../api/drivers';
import { companyService } from '../../../api/company';
import { EmptyState } from '../../../components/EmptyState';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { useHeaderAutoHide } from '../../../hooks/useHeaderAutoHide';

export default function Page() {
    useHeaderAutoHide();
    const pageContext = usePageContext();
    const driverId = pageContext.routeParams?.id;

    const [driverData, setDriverData] = useState<any>(null);
    const [availableDocTypes, setAvailableDocTypes] = useState<any[]>([]);
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

    const defaultDocTypes = [
        { id: 'dct_licence', name: 'Permis de Conduire' },
        { id: 'dct_identity', name: 'CNI / Passeport' },
        { id: 'dct_insurance', name: 'Assurance Véhicule' },
        { id: 'dct_criminal_record', name: 'Casier Judiciaire' }
    ];

    useEffect(() => {
        if (driverId) loadDriver();
    }, [driverId]);

    const loadDriver = async () => {
        try {
            const [driverRes, requirementsRes] = await Promise.all([
                driverService.getDriver(driverId),
                companyService.getRequirements()
            ]);

            setDriverData(driverRes.data);

            if (requirementsRes.data && requirementsRes.data.length > 0) {
                setAvailableDocTypes(requirementsRes.data.map((r: any) => ({
                    id: r.id.startsWith('dct_') ? r.id : `dct_${r.id}`,
                    name: r.label
                })));
            } else {
                setAvailableDocTypes(defaultDocTypes);
            }

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
            await driverService.inviteToFleet(driverData.driver.id);
            await loadDriver();
            setShowInviteConfirm(false);
        } catch (err: any) {
            setInvitationError(err.response?.data?.message || 'Erreur lors de l\'envoi de l\'invitation.');
        } finally {
            setIsInviting(false);
        }
    };

    const getDocTypeLabel = (typeId: string) => {
        const found = availableDocTypes.find(t => t.id === typeId || t.id === `dct_${typeId}`);
        return found ? found.name : typeId.replace('dct_', '').replace(/_/g, ' ').toUpperCase();
    };

    if (isLoading) return <div className="p-12 text-center text-slate-400 font-black italic uppercase animate-pulse">Chargement de la matrice...</div>;
    if (error) return <div className="p-8 text-center text-rose-500 bg-rose-50 rounded-3xl border border-rose-100 m-12 font-bold">{error}</div>;
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
        <div className="max-w-6xl mx-auto space-y-6 text-slate-900 dark:text-slate-100 pb-12">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-5">
                    <button onClick={() => window.location.href = '/drivers'} className="p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-all text-slate-600 dark:text-slate-400">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase italic">{driver.fullName}</h1>
                            <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black border transition-colors ${driverData.status === 'ACCEPTED' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' :
                                driverData.status === 'REJECTED' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20'
                                }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${driverData.status === 'ACCEPTED' ? 'bg-emerald-500' : 'bg-amber-500'} mr-2`}></div>
                                {driverData.status === 'ACCEPTED' ? 'OPÉRATIONNEL' : driverData.status === 'REJECTED' ? 'REJETÉ' : 'EN ATTENTE'}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Send size={12} className="text-indigo-400" /> {driver.email}
                                <span className="opacity-30">•</span>
                                <Clock size={12} className="text-amber-400" /> Inscrit le {driverData.acceptedAt ? new Date(driverData.acceptedAt).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="px-6 py-2.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
                        <FileText size={16} />
                        <span>Contrat</span>
                    </button>
                    {driverData.status === 'ACCEPTED' && (
                        <a href={`/map?driver_id=${driver.id}`} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none flex items-center gap-2">
                            <MapPin size={16} />
                            <span>Live Map</span>
                        </a>
                    )}
                </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Revenus Mensuels', value: '450.000 FCFA', icon: Briefcase, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                    { label: 'Score Excellence', value: '4.95', icon: UserCheck, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                    { label: 'Missions Totales', value: '1,248', icon: Package, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                    { label: 'Taux Succès', value: '99.2%', icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center gap-4">
                        <div className={`p-2.5 ${stat.bg} ${stat.color} rounded-2xl`}>
                            <stat.icon size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-lg font-black text-slate-900 dark:text-slate-100 leading-none mt-1">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden min-h-[500px]">
                <div className="flex border-b border-gray-100 dark:border-slate-800 overflow-x-auto">
                    {[
                        { id: 'INFO', label: 'Profil & Bio', icon: User },
                        { id: 'ASSIGNMENTS', label: 'Opérations', icon: Calendar },
                        { id: 'ORDERS', label: 'Journal des Missions', icon: Package },
                        { id: 'DOCS', label: 'Dossier Professionnel', icon: FileText },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id as any)}
                            className={`flex items-center px-8 py-5 text-sm font-black transition-all border-b-2 whitespace-nowrap uppercase italic tracking-tighter ${activeTab === tab.id
                                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30 dark:bg-indigo-500/10'
                                : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            <tab.icon size={16} className="mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-8">
                    {/* INFO TAB */}
                    {activeTab === 'INFO' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in duration-300">
                            <div>
                                <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                                    <User size={14} className="text-indigo-600 dark:text-indigo-400" /> Identité & Contact
                                </h3>
                                <dl className="grid grid-cols-1 gap-4">
                                    <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl">
                                        <dt className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Numéro de Téléphone</dt>
                                        <dd className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1 font-mono">{driver.phone}</dd>
                                    </div>
                                    <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl">
                                        <dt className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Adresse Email</dt>
                                        <dd className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1">{driver.email || '-'}</dd>
                                    </div>
                                    <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl">
                                        <dt className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Date de Naissance</dt>
                                        <dd className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1">12 Mai 1992 (31 ans)</dd>
                                    </div>
                                    <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl">
                                        <dt className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Prochaine Évaluation</dt>
                                        <dd className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1">15 Février 2024</dd>
                                    </div>
                                </dl>
                            </div>
                            <div className="bg-indigo-900 text-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
                                    <UserCheck size={120} />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em] mb-4">Score de Sécurité</p>
                                    <p className="text-4xl font-black mb-2">98.5/100</p>
                                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                                        <TrendingUp size={14} /> +2.4% ce mois-ci
                                    </div>
                                    <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-8">
                                        <div>
                                            <p className="text-[10px] font-black opacity-50 uppercase">Ponctualité</p>
                                            <p className="text-lg font-black">99.8%</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black opacity-50 uppercase">Avis Clients</p>
                                            <p className="text-lg font-black flex items-center gap-1">4.9 <Star size={14} fill="currentColor" /></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ASSIGNMENTS TAB */}
                    {activeTab === 'ASSIGNMENTS' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                                        <Truck size={80} className="text-slate-400 dark:text-slate-100" />
                                    </div>
                                    <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 italic">Véhicule Assigné</h3>
                                    {currentVehicle ? (
                                        <div>
                                            <h4 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase italic tracking-tighter">{currentVehicle.brand} {currentVehicle.model}</h4>
                                            <p className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-1">{currentVehicle.plate}</p>
                                            <a href={`/fleet/${currentVehicle.id}`} className="mt-6 inline-flex items-center gap-2 text-[10px] font-black bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all uppercase tracking-widest text-slate-700 dark:text-slate-300">
                                                Fiche Technique <ChevronRight size={14} />
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="py-4">
                                            <p className="text-sm text-slate-400 dark:text-slate-500 font-bold italic uppercase tracking-widest">Aucune machine assignée</p>
                                            <a href="/fleet" className="mt-4 inline-flex items-center gap-2 text-[10px] font-black bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none transition-all uppercase tracking-widest">
                                                Assigner un véhicule
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                                        <MapPin size={80} className="text-slate-400 dark:text-slate-100" />
                                    </div>
                                    <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 italic">Zone Stratégique</h3>
                                    {assignedZones && assignedZones.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {assignedZones.map((zone: any) => (
                                                <a
                                                    key={zone.id}
                                                    href={`/map?zone_id=${zone.id}`}
                                                    className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-all group/zone"
                                                >
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: zone.color }} />
                                                    <span className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase italic tracking-tighter">{zone.name}</span>
                                                    <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 group-hover/zone:text-indigo-600 dark:group-hover/zone:text-indigo-400" />
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 font-bold italic">Périmètre non défini</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-8">
                                <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-4">
                                    <Calendar size={14} className="text-indigo-600 dark:text-indigo-400" /> Planning des Opérations
                                </h3>
                                {assignedSchedules && assignedSchedules.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {assignedSchedules.map((schedule: any) => {
                                            const Icon = getIconComponent(schedule.icon);
                                            return (
                                                <div key={schedule.id} className="bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4 group hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-colors">
                                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: schedule.color || '#6366f1' }}>
                                                        <Icon size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase italic tracking-tighter">{schedule.title}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-2">
                                                            <Clock size={12} /> {schedule.startTime} - {schedule.endTime}
                                                            <span className="opacity-30">•</span>
                                                            {formatRecurrence(schedule)}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                                        <p className="text-sm text-slate-400 dark:text-slate-600 font-bold italic uppercase tracking-widest">Aucun créneau opérationnel</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ORDERS TAB */}
                    {activeTab === 'ORDERS' && (
                        <div className="animate-in fade-in duration-300">
                            {recentOrders && recentOrders.length > 0 ? (
                                <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900">
                                    <table className="min-w-full divide-y divide-slate-50 dark:divide-slate-800">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                                <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th>
                                                <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Référence</th>
                                                <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Trajet</th>
                                                <th scope="col" className="px-6 py-4 text-right text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Statut</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                            {recentOrders.map((order: any) => (
                                                <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <p className="text-xs font-black text-slate-700 dark:text-slate-300">{new Date(order.createdAt).toLocaleDateString()}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase italic">
                                                        #{order.id.slice(-6)}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="truncate max-w-[200px] font-bold text-slate-700 dark:text-slate-300" title={order.pickupAddress?.formattedAddress}>{order.pickupAddress?.formattedAddress || 'N/A'}</span>
                                                            <span className="truncate max-w-[200px] dark:text-slate-500" title={order.deliveryAddress?.formattedAddress}>{order.deliveryAddress?.formattedAddress || 'N/A'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black italic uppercase ${order.status === 'DELIVERED' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20' :
                                                            order.status === 'CANCELLED' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20' :
                                                                'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Package}
                                    title="Aucune mission"
                                    description="Aucune course n'a encore été effectuée par ce chauffeur."
                                />
                            )}
                        </div>
                    )}

                    {/* DOCS TAB */}
                    {activeTab === 'DOCS' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 border border-slate-800 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <FileText size={100} />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Dossier de Conformité Professional</h3>
                                    <p className="text-sm opacity-60 mt-2 font-bold max-w-md text-slate-300">
                                        {driverData.status === 'ACCEPTED' ? "Ce dossier est complet et le chauffeur est actif dans la flotte." : "Vérifiez les documents requis pour l'activation finale."}
                                    </p>
                                </div>
                                <div className="relative z-10">
                                    {driverData.status === 'ACCESS_ACCEPTED' && driverData.docsStatus === 'APPROVED' && (
                                        <button onClick={() => setShowInviteConfirm(true)} className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase italic tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all">
                                            Lancer l'Invitation
                                        </button>
                                    )}
                                    {driverData.status === 'ACCEPTED' && (
                                        <div className="flex items-center gap-3 px-6 py-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl font-black uppercase italic tracking-widest">
                                            <UserCheck size={20} /> Dossier Validé
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-1 space-y-6">
                                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-2 italic">Exigences Critiques</h4>
                                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                                        {availableDocTypes.map(type => {
                                            const isSelected = driverData.requiredDocTypes?.includes(type.id);
                                            return (
                                                <label key={type.id} className={`flex items-center gap-4 p-5 border-b border-slate-50 dark:border-slate-800 cursor-pointer transition-all ${isSelected ? 'bg-indigo-50/30 dark:bg-indigo-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={async (e) => {
                                                            const current = driverData.requiredDocTypes || [];
                                                            const next = e.target.checked ? [...current, type.id] : current.filter((id: string) => id !== type.id);
                                                            try { await driverService.setRequiredDocs(driver.id, next); loadDriver(); } catch (err) { alert('Sync Fail'); }
                                                        }}
                                                        className="w-5 h-5 text-indigo-600 dark:text-indigo-400 border-slate-300 dark:border-slate-700 rounded-lg focus:ring-indigo-500 bg-white dark:bg-slate-800"
                                                    />
                                                    <span className={`text-xs font-black uppercase italic tracking-tighter ${isSelected ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-400 dark:text-slate-500'}`}>
                                                        {type.name}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="lg:col-span-2 space-y-6">
                                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-2 italic">Examen des Pièces Jointes</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(driverData.documents || []).map((doc: any) => (
                                            <div key={doc.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none group hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-all">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase italic">{getDocTypeLabel(doc.documentType)}</h5>
                                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${doc.status === 'APPROVED' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'}`}>
                                                        {doc.status}
                                                    </span>
                                                </div>
                                                {doc.file ? (
                                                    <div className="space-y-4">
                                                        <div className="aspect-video bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700 relative group/img overflow-hidden">
                                                            <FileText size={40} className="text-slate-200 dark:text-slate-700" />
                                                            <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center">
                                                                <button onClick={() => window.open(`/api/v1/fs/${doc.file.name}`, '_blank')} className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl hover:scale-110 transition-transform">
                                                                    <ExternalLink size={20} className="text-indigo-600 dark:text-indigo-400" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={async () => { try { await driverService.validateDocument(doc.id, 'APPROVED'); loadDriver(); } catch (err) { alert('Approval Error'); } }}
                                                                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase italic transition-all ${doc.status === 'APPROVED' ? 'bg-emerald-500 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'}`}
                                                            >
                                                                Dossier OK
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="py-10 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                                                        <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest italic">Document Manquant</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
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
                title="Validation Stratégique"
                description={`Confirmez-vous l'intégration de ${driver.fullName} dans les effectifs actifs ? Une notification formelle sera envoyée au terminal du chauffeur.`}
                confirmLabel={isInviting ? "Transmission..." : "Confirmer l'Intégration"}
                confirmVariant="primary"
            />
        </div>
    );
}
