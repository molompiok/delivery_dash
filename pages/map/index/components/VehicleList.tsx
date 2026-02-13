import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Truck, Car, Bike, Info, ShieldCheck, Clock } from 'lucide-react';
import { Vehicle } from '../../../../api/types';

interface VehicleListProps {
    vehicles: Vehicle[];
    activeVehicleId: string | null;
    onSelectVehicle: (id: string | null) => void;
    onOpenDetail: (id: string) => void;
}

const VEHICLE_ICONS: Record<string, any> = {
    'MOTO': Bike,
    'CAR_SEDAN': Car,
    'VAN': Truck,
    'TRUCK': Truck,
    'BICYCLE': Bike
};

const VEHICLE_COLORS: Record<string, string> = {
    'MOTO': 'indigo',
    'CAR_SEDAN': 'emerald',
    'VAN': 'blue',
    'TRUCK': 'amber',
    'BICYCLE': 'orange'
};

export const VehicleList: React.FC<VehicleListProps> = ({
    vehicles,
    activeVehicleId,
    onSelectVehicle,
    onOpenDetail
}) => {
    return (
        <motion.div
            key="vehicle-list"
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="space-y-3 h-full overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-indigo-50/50 dark:bg-indigo-500/10 p-2 rounded-xl border border-indigo-100/50 dark:border-indigo-500/20">
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase block mb-1">Total flotte</span>
                    <span className="text-xl font-black text-indigo-700 dark:text-indigo-400">{vehicles.length}</span>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-500/10 p-2 rounded-xl border border-emerald-100/50 dark:border-emerald-500/20">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase block mb-1">Assignés</span>
                    <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">{vehicles.filter(v => v.assignedDriverId).length}</span>
                </div>
            </div>

            {vehicles.length === 0 ? (
                <div className="text-center py-10">
                    <Truck className="mx-auto h-12 w-12 text-gray-200 dark:text-slate-800 mb-2" />
                    <p className="text-sm text-gray-400 dark:text-slate-500">Aucun véhicule trouvé</p>
                </div>
            ) : (
                vehicles.map(vehicle => {
                    const isActive = activeVehicleId === vehicle.id;
                    const Icon = VEHICLE_ICONS[vehicle.type] || Truck;
                    const color = VEHICLE_COLORS[vehicle.type] || 'gray';
                    const isAssigned = !!vehicle.assignedDriverId;

                    return (
                        <div
                            key={vehicle.id}
                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border group relative overflow-hidden ${isActive ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30' : 'bg-white dark:bg-slate-800/50 border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700'}`}
                        >
                            <div
                                className="flex-1 flex items-center gap-3 cursor-pointer"
                                onClick={() => onSelectVehicle(isActive ? null : vehicle.id)}
                            >
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm bg-${color}-50 text-${color}-600`}>
                                    <Icon size={20} />
                                </div>

                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-slate-100 leading-tight">{vehicle.brand} {vehicle.model}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700 uppercase tracking-tighter shadow-sm">{vehicle.plate}</span>
                                        <span className="text-gray-300 dark:text-slate-700">•</span>
                                        <div className="flex items-center gap-1">
                                            {isAssigned ? (
                                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                                    <ShieldCheck size={10} /> {vehicle.assignedDriver?.fullName?.split(' ')[0] || 'Assigné'}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500 flex items-center gap-0.5">
                                                    <Clock size={10} /> Dispo
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenDetail(vehicle.id);
                                }}
                                className="p-2 text-gray-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    );
                })
            )}

            {/* Custom Tailwind utilities since they might not be in the main bundle */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .bg-emerald-50 { background-color: #ecfdf5; }
                .text-emerald-600 { color: #059669; }
                .bg-indigo-50 { background-color: #eef2ff; }
                .text-indigo-600 { color: #4f46e5; }
                .bg-blue-50 { background-color: #eff6ff; }
                .text-blue-600 { color: #2563eb; }
                .bg-amber-50 { background-color: #fffbeb; }
                .text-amber-600 { color: #d97706; }
                .bg-orange-50 { background-color: #fff7ed; }
                .text-orange-600 { color: #ea580c; }

                .dark .bg-emerald-50 { background-color: rgba(16, 185, 129, 0.1); }
                .dark .text-emerald-600 { color: #34d399; }
                .dark .bg-indigo-50 { background-color: rgba(79, 70, 229, 0.1); }
                .dark .text-indigo-600 { color: #818cf8; }
                .dark .bg-blue-50 { background-color: rgba(37, 99, 235, 0.1); }
                .dark .text-blue-600 { color: #60a5fa; }
                .dark .bg-amber-50 { background-color: rgba(217, 119, 6, 0.1); }
                .dark .text-amber-600 { color: #fbbf24; }
                .dark .bg-orange-50 { background-color: rgba(234, 88, 12, 0.1); }
                .dark .text-orange-600 { color: #fb923c; }
            `}} />
        </motion.div>
    );
};
