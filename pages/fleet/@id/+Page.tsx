import React, { useEffect, useState, useRef } from 'react';
import { usePageContext } from 'vike-react/usePageContext';
import { Truck, User as UserIcon, FileText, Save, ArrowLeft, Upload, Paperclip, AlertCircle, CheckCircle, Calendar, Trash2, MapPin, Package, Edit, Clock } from 'lucide-react';
import { fleetService } from '../../../api/fleet';
import { driverService } from '../../../api/drivers';
import { Vehicle, User, FileRecord, CompanyDriverSetting } from '../../../api/types';
import { VehicleEditModal } from '../../../components/VehicleEditModal';
import { EmptyState } from '../../../components/EmptyState';
import { ConfirmModal } from '../../../components/ConfirmModal';

const VEHICLE_TYPE_LABELS: Record<string, string> = {
    'MOTO': 'Moto',
    'CAR_SEDAN': 'Voiture',
    'VAN': 'Utilitaire',
    'TRUCK': 'Poids Lourd',
    'BICYCLE': 'Vélo'
};

const ENERGY_LABELS: Record<string, string> = {
    'GASOLINE': 'Essence',
    'DIESEL': 'Diesel',
    'ELECTRIC': 'Électrique',
    'HYBRID': 'Hybride',
    '': 'Inconnu'
};

export default function Page() {
    const pageContext = usePageContext();
    const vehicleId = pageContext.routeParams?.id;
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [drivers, setDrivers] = useState<CompanyDriverSetting[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'DETAILS' | 'FILES' | 'DRIVER' | 'ORDERS'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('vehicle_detail_tab') as any) || 'DETAILS';
        }
        return 'DETAILS';
    });

    const handleTabChange = (tab: typeof activeTab) => {
        setActiveTab(tab);
        localStorage.setItem('vehicle_detail_tab', tab);
    };
    const [error, setError] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // File Upload State
    const [isUploading, setIsUploading] = useState(false);
    const [docType, setDocType] = useState('VEHICLE_INSURANCE');
    const [expiryDate, setExpiryDate] = useState('');
    const [replacingFile, setReplacingFile] = useState<FileRecord | null>(null);
    const [showConfirmReplace, setShowConfirmReplace] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
    const replaceInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, [vehicleId]);

    useEffect(() => {
        if (activeTab === 'ORDERS' && !orders.length) {
            loadOrders();
        }
    }, [activeTab]);

    const loadData = async () => {
        try {
            const [vehicleRes, driversRes] = await Promise.all([
                fleetService.getVehicle(vehicleId),
                driverService.listDrivers()
            ]);
            setVehicle(vehicleRes.data);
            setDrivers(driversRes.data);
        } catch (err) {
            console.error(err);
            setError('Impossible de charger les données du véhicule.');
        } finally {
            setIsLoading(false);
        }
    };

    const loadOrders = async () => {
        try {
            const res = await fleetService.getVehicleOrders(vehicleId);
            setOrders(res.data);
        } catch (err) {
            console.error("Failed to load orders", err);
        }
    }

    const handleAssignDriver = async (driverId: string | null) => {
        try {
            await fleetService.assignDriver(vehicleId, driverId);
            loadData(); // Refresh
        } catch (err: any) {
            alert(err.message || 'Erreur lors de l\'assignation');
        }
    };

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fileInputRef.current?.files?.[0]) return;

        setIsUploading(true);
        try {
            const file = fileInputRef.current.files[0];
            await fleetService.uploadDocument(vehicleId, docType, file, expiryDate);

            // Reset form
            if (fileInputRef.current) fileInputRef.current.value = '';
            setExpiryDate('');

            // Refresh data
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erreur upload');
        } finally {
            setIsUploading(false);
        }
    };

    const handleReplaceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        console.log('🔄 Remplacement - Fichier sélectionné:', file?.name);

        if (!file || !replacingFile) {
            console.warn('⚠️ Remplacement avorté: fichier ou cible manquante', { file: !!file, target: !!replacingFile });
            return;
        }

        setIsUploading(true);
        try {
            console.log('📤 Envoi du nouveau document...', { type: replacingFile.tableColumn });
            await fleetService.uploadDocument(
                vehicleId,
                replacingFile.tableColumn,
                file,
                replacingFile.metadata?.expiryDate
            );

            console.log('🗑️ Suppression de l\'ancien document:', replacingFile.id);
            await fleetService.deleteDocument(replacingFile.id);

            console.log('✅ Remplacement réussi');
            loadData();
        } catch (err: any) {
            console.error('❌ Erreur lors du remplacement:', err);
            alert(err.response?.data?.message || 'Erreur lors du remplacement');
        } finally {
            setIsUploading(false);
            setReplacingFile(null);
            if (replaceInputRef.current) replaceInputRef.current.value = '';
        }
    };

    const handleDeleteFile = async (fileId: string) => {
        setDeletingFileId(fileId);
        setShowConfirmDelete(true);
    };

    const confirmDelete = async () => {
        if (!deletingFileId) return;
        try {
            await fleetService.deleteDocument(deletingFileId);
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erreur lors de la suppression');
        } finally {
            setDeletingFileId(null);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;
    if (!vehicle) return <div className="p-8 text-center text-red-500">{error || 'Véhicule introuvable'}</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <a href="/fleet" className="text-gray-500 hover:text-gray-700 flex items-center mb-2 text-sm transition-colors">
                        <ArrowLeft size={16} className="mr-1" /> Retour Véhicules
                    </a>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        {vehicle.brand} {vehicle.model}
                        <span className="text-lg font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-md font-mono border border-gray-200">
                            {vehicle.plate}
                        </span>
                    </h1>
                    <div className="flex items-center gap-4 mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${vehicle.verificationStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                            vehicle.verificationStatus === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {vehicle.verificationStatus}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center">
                            {VEHICLE_TYPE_LABELS[vehicle.type] || vehicle.type}
                            <span className="mx-2">•</span>
                            {ENERGY_LABELS[vehicle.energy] || vehicle.energy || 'Non spécifié'}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2 rounded-lg font-medium flex items-center shadow-sm transition-colors"
                >
                    <Edit size={16} className="mr-2" />
                    Modifier
                </button>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
                <div className="flex border-b border-gray-200 overflow-x-auto">
                    {[
                        { id: 'DETAILS', label: 'Informations', icon: FileText },
                        { id: 'DRIVER', label: `Chauffeur (${vehicle.assignedDriver ? '1' : '0'})`, icon: UserIcon },
                        { id: 'ORDERS', label: 'Commandes', icon: Package },
                        { id: 'FILES', label: `Documents (${vehicle.files?.length || 0})`, icon: Paperclip },
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
                    {/* DETAILS TAB */}
                    {activeTab === 'DETAILS' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 animate-in fade-in duration-300">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center">
                                        <Truck size={14} className="mr-2" /> Caractéristiques
                                    </h3>
                                    {vehicle.assignedDriverId && (
                                        <a
                                            href={`/map?vehicle_id=${vehicle.id}`}
                                            className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold border border-blue-100 hover:bg-blue-100 transition-all shadow-sm group"
                                        >
                                            <MapPin size={16} className="mr-2 group-hover:scale-110 transition-transform" />
                                            Voir en direct
                                        </a>
                                    )}
                                </div>
                                <dl className="space-y-4">
                                    <DetailRow label="Marque" value={vehicle.brand} />
                                    <DetailRow label="Modèle" value={vehicle.model} />
                                    <DetailRow label="Année" value={vehicle.year?.toString() || '-'} />
                                    <DetailRow label="Energie" value={ENERGY_LABELS[vehicle.energy] || vehicle.energy} />
                                    <DetailRow label="Couleur" value={vehicle.color || '-'} />
                                </dl>
                            </div>
                            <div>
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                                    <Package size={14} className="mr-2" /> Capacités Logistiques
                                </h3>
                                <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
                                    <dl className="space-y-4">
                                        <DetailRow label="Poids Max" value={vehicle.specs?.maxWeight ? `${vehicle.specs.maxWeight} kg` : '-'} />
                                        <DetailRow label="Volume" value={vehicle.specs?.cargoVolume ? `${vehicle.specs.cargoVolume} m³` : '-'} />
                                        <DetailRow label="Longueur" value={vehicle.specs?.length ? `${vehicle.specs.length} m` : '-'} />
                                        <DetailRow label="Largeur" value={vehicle.specs?.width ? `${vehicle.specs.width} m` : '-'} />
                                        <DetailRow label="Hauteur" value={vehicle.specs?.height ? `${vehicle.specs.height} m` : '-'} />
                                    </dl>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DRIVER TAB */}
                    {activeTab === 'DRIVER' && (
                        <div className="max-w-2xl mx-auto py-8 animate-in fade-in duration-300">
                            <div className="text-center mb-10">
                                <div className="w-24 h-24 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 shadow-inner">
                                    {vehicle.assignedDriver ? (
                                        <span className="text-4xl font-bold">{vehicle.assignedDriver.fullName?.charAt(0) || '?'}</span>
                                    ) : (
                                        <UserIcon size={48} />
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    {vehicle.assignedDriver ? vehicle.assignedDriver.fullName : 'Aucun chauffeur assigné'}
                                </h3>
                                <p className="text-gray-500 mt-1">
                                    {vehicle.assignedDriver ? vehicle.assignedDriver.phone : 'Assignez un chauffeur pour mettre ce véhicule en service'}
                                </p>
                            </div>

                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Gestion de l'assignation</label>
                                <div className="flex gap-2">
                                    <select
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5 border"
                                        value={vehicle.assignedDriverId || ''}
                                        onChange={(e) => handleAssignDriver(e.target.value || null)}
                                    >
                                        <option value="">-- Sélectionner un chauffeur --</option>
                                        {drivers.map((item: any) => {
                                            const driver = item.driver || item;
                                            return (
                                                <option key={driver.id} value={driver.id}>
                                                    {driver.fullName || driver.firstName + ' ' + driver.lastName} ({driver.phone})
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <p className="text-xs text-gray-500 mt-3 flex items-center">
                                    <AlertCircle size={12} className="mr-1" />
                                    L'assignation est immédiate. Le chauffeur recevra une notification.
                                </p>
                            </div>

                            {/* Assignment History */}
                            <div className="mt-12">
                                <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center">
                                    <Clock size={16} className="mr-2 text-gray-400" /> Historique des assignations
                                </h3>
                                <div className="relative border-l-2 border-gray-100 ml-3 pl-8 space-y-8">
                                    {vehicle.metadata?.assignmentHistory && vehicle.metadata.assignmentHistory.length > 0 ? (
                                        [...vehicle.metadata.assignmentHistory].reverse().map((entry, idx) => (
                                            <div key={idx} className="relative">
                                                <div className={`absolute -left-[41px] top-0 w-5 h-5 rounded-full border-2 border-white shadow-sm ${entry.action === 'ASSIGNED' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                                <div>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="text-sm font-bold text-gray-900">
                                                            {entry.action === 'ASSIGNED' ? 'Assigné à' : 'Désassigné de'} <span className="text-emerald-600">{entry.driverName}</span>
                                                        </p>
                                                        <span className="text-xs text-gray-400 font-medium">
                                                            {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        Par <span className="font-semibold text-gray-700">{entry.managerName}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-400 -ml-8 py-4 text-center italic font-medium bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                                            Aucun historique d'assignation disponible pour ce véhicule.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ORDERS TAB */}
                    {activeTab === 'ORDERS' && (
                        <div className="animate-in fade-in duration-300">
                            {orders.length === 0 ? (
                                <EmptyState
                                    icon={Package}
                                    title="Aucune course"
                                    description="Aucune course n'a encore été effectuée avec ce véhicule."
                                />
                            ) : (
                                <div className="overflow-hidden border border-gray-200 rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ref</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chauffeur</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Départ / Arrivée</th>
                                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {orders.map((order) => (
                                                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(order.createdAt).toLocaleDateString()} <span className="text-xs">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        #{order.id.substring(order.id.length - 6)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {order.driver ? order.driver.fullName : '-'}
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
                            )}
                        </div>
                    )}

                    {/* FILES TAB */}
                    {activeTab === 'FILES' && (
                        <div className="space-y-8 animate-in fade-in duration-300">


                            {/* Upload Form */}
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200/60">
                                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                                    <Upload size={16} className="mr-2" /> Ajouter un document
                                </h3>
                                <form onSubmit={handleFileUpload} className="flex flex-col md:flex-row gap-4 items-end">
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Type de document</label>
                                        <select
                                            value={docType}
                                            onChange={(e) => setDocType(e.target.value)}
                                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5 bg-white border"
                                        >
                                            <option value="VEHICLE_INSURANCE">Assurance</option>
                                            <option value="VEHICLE_TECHNICAL_VISIT">Visite Technique</option>
                                            <option value="VEHICLE_REGISTRATION">Carte Grise</option>
                                        </select>
                                    </div>
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Fichier</label>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-colors bg-white border border-gray-200 rounded-lg"
                                        />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Date d'expiration</label>
                                        <input
                                            type="date"
                                            value={expiryDate}
                                            onChange={(e) => setExpiryDate(e.target.value)}
                                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5 bg-white border"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isUploading}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
                                    >
                                        {isUploading ? 'Envoi...' : 'Ajouter'}
                                    </button>
                                </form>
                            </div>

                            {/* Files List */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-4 px-1">Documents enregistrés</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {vehicle.files?.map(file => (
                                        <FileCard
                                            key={file.id}
                                            file={file}
                                            onDelete={() => handleDeleteFile(file.id)}
                                            onUpdateClick={() => {
                                                setReplacingFile(file);
                                                setShowConfirmReplace(true);
                                            }}
                                        />
                                    ))}
                                    <input
                                        type="file"
                                        ref={replaceInputRef}
                                        className="hidden"
                                        onChange={handleReplaceUpload}
                                    />
                                    {!vehicle.files?.length && (
                                        <div className="col-span-2 text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                            <Paperclip className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                                            <p className="text-sm text-gray-400">Aucun document n'a été ajouté pour ce véhicule.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <ConfirmModal
                isOpen={showConfirmReplace}
                onClose={() => {
                    setShowConfirmReplace(false);
                }}
                onConfirm={() => {
                    console.log('🎯 Confirmation de remplacement pour:', replacingFile?.name);
                    if (replaceInputRef.current) {
                        replaceInputRef.current.value = ''; // Force reset to allow re-selection
                        replaceInputRef.current.click();
                    }
                    setShowConfirmReplace(false);
                }}
                title="Remplacer le document"
                description={`Voulez-vous remplacer le document "${replacingFile?.name}" ? L'ancienne version sera définitivement supprimée.`}
                confirmLabel="Continuer"
                confirmVariant="primary"
            />

            <ConfirmModal
                isOpen={showConfirmDelete}
                onClose={() => {
                    setShowConfirmDelete(false);
                    setDeletingFileId(null);
                }}
                onConfirm={confirmDelete}
                title="Supprimer le document"
                description="Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible."
                confirmLabel="Supprimer"
                confirmVariant="danger"
            />

            {isEditModalOpen && vehicle && (
                <VehicleEditModal
                    vehicle={vehicle}
                    onClose={() => setIsEditModalOpen(false)}
                    onUpdate={(updated) => setVehicle(updated)}
                />
            )}
        </div>
    );
}

function DetailRow({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
            <span className="text-sm text-gray-500 font-medium">{label}</span>
            <span className="text-sm font-semibold text-gray-900 text-right">{value}</span>
        </div>
    );
}

function FileCard({ file, onDelete, onUpdateClick }: { file: FileRecord, onDelete: () => void, onUpdateClick: () => void }) {
    const [isOpening, setIsOpening] = useState(false);

    const getExpiryDate = () => {
        if (!file.metadata?.expiryDate) return null;
        const date = new Date(file.metadata.expiryDate);
        return isNaN(date.getTime()) ? null : date;
    };

    const expiryDate = getExpiryDate();
    const now = new Date();
    const isExpired = expiryDate ? expiryDate < now : false;

    // Calculate days until expiry
    const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
    const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 7;

    const handleView = async () => {
        setIsOpening(true);
        try {
            const url = await fleetService.getDocumentViewUrl(file.id);
            window.open(url, '_blank');
        } catch (err: any) {
            alert('Impossible d\'ouvrir le document');
        } finally {
            setIsOpening(false);
        }
    };



    // Determine card border color based on expiry
    const getBorderColor = () => {
        if (isExpired) return 'border-red-300 hover:border-red-400';
        if (isExpiringSoon) return 'border-amber-300 hover:border-amber-400';
        return 'border-gray-200 hover:border-emerald-200';
    };

    return (
        <div className={`flex flex-col p-4 bg-white border rounded-xl hover:shadow-sm transition-all group ${getBorderColor()}`}>
            <div className="flex items-start mb-4">
                <div className={`p-2.5 rounded-lg mr-4 flex-shrink-0 ${isExpired
                    ? 'bg-red-50 text-red-600'
                    : isExpiringSoon
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                    }`}>
                    <FileText size={24} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-bold text-gray-900 truncate">{file.name}</h4>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{file.fileCategory} • {file.mimeType}</p>

                    {/* Expiry Date Display */}
                    {expiryDate && (
                        <div className={`flex items-center mt-2 text-xs font-bold ${isExpired
                            ? 'text-red-600'
                            : isExpiringSoon
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}>
                            <Calendar size={12} className="mr-1.5" />
                            {expiryDate.toLocaleDateString()}
                            {isExpired && (
                                <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] uppercase tracking-wide">
                                    Expiré
                                </span>
                            )}
                            {isExpiringSoon && !isExpired && (
                                <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] uppercase tracking-wide">
                                    {daysUntilExpiry}j restants
                                </span>
                            )}
                        </div>
                    )}


                </div>
            </div>

            <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-100">
                <button
                    onClick={handleView}
                    disabled={isOpening}
                    className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                    <ArrowLeft size={14} className="rotate-135" /> {isOpening ? '...' : 'Ouvrir'}
                </button>
                <button
                    onClick={onUpdateClick}
                    className="flex-1 bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    title="Remplacer le document"
                >
                    <Edit size={14} /> Remplacer
                </button>
                <button
                    onClick={onDelete}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                    title="Supprimer"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}
