import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Truck, Car, Bike, ShieldCheck, User as UserIcon, Calendar, Gauge, Fuel, Weight, Box } from 'lucide-react';
import { Vehicle } from '../../../../api/types';

interface VehicleDetailProps {
    vehicle: Vehicle;
    onBack: () => void;
}

const VEHICLE_ICONS: Record<string, any> = {
    'MOTO': Bike,
    'CAR_SEDAN': Car,
    'VAN': Truck,
    'TRUCK': Truck,
    'BICYCLE': Bike
};

const ENERGY_LABELS: Record<string, string> = {
    'GASOLINE': 'Essence',
    'DIESEL': 'Diesel',
    'ELECTRIC': 'Électrique',
    'HYBRID': 'Hybride'
};

export const VehicleDetail: React.FC<VehicleDetailProps> = ({
    vehicle,
    onBack
}) => {
    if (!vehicle) return null;
    const Icon = VEHICLE_ICONS[vehicle?.type] || Truck;

    return (
        <motion.div
            key="vehicle-detail"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="h-full flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 font-medium text-xs uppercase tracking-wide group"
            >
                <div className="p-1 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                    <ChevronLeft size={14} />
                </div>
                Retour au parc
            </button>

            <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner border border-indigo-100">
                        <Icon size={32} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900">{vehicle.brand} {vehicle.model}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 font-mono tracking-widest">{vehicle.plate}</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${vehicle.verificationStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                                vehicle.verificationStatus === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                                }`}>
                                {vehicle.verificationStatus}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stats / Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Calendar size={12} className="text-gray-400" />
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Année</p>
                        </div>
                        <p className="text-sm font-black text-gray-900">{vehicle.year || '-'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Fuel size={12} className="text-gray-400" />
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Énergie</p>
                        </div>
                        <p className="text-sm font-black text-gray-900">{ENERGY_LABELS[vehicle.energy] || vehicle.energy}</p>
                    </div>
                </div>

                {/* Logistics Specs */}
                <div className="bg-indigo-50/30 rounded-2xl p-4 border border-indigo-100/50">
                    <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Gauge size={14} /> Spécifications logistiques
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-indigo-600/60 font-medium flex items-center gap-1.5">
                                <Weight size={12} /> Charge MAX
                            </span>
                            <span className="font-bold text-indigo-900">{vehicle.specs?.maxWeight ? `${vehicle.specs.maxWeight} kg` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-indigo-600/60 font-medium flex items-center gap-1.5">
                                <Box size={12} /> Volume utile
                            </span>
                            <span className="font-bold text-indigo-900">{vehicle.specs?.cargoVolume ? `${vehicle.specs.cargoVolume} m³` : 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Driver Info */}
                <div>
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">Chauffeur assigné</h3>
                    {vehicle.assignedDriver ? (
                        <div className="bg-white border hover:border-indigo-300 transition-all border-gray-100 rounded-2xl p-4 flex items-center justify-between group cursor-pointer shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                    <UserIcon size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{vehicle.assignedDriver.fullName}</p>
                                    <p className="text-[10px] text-gray-500 font-medium">{vehicle.assignedDriver.phone}</p>
                                </div>
                            </div>
                            <ShieldCheck className="text-emerald-500" size={20} />
                        </div>
                    ) : (
                        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center">
                            <p className="text-xs text-gray-400 font-medium italic">Aucun chauffeur actif sur ce véhicule</p>
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <a
                    style={{ textDecoration: 'none', color: 'white' }}
                    href={`/fleet/${vehicle.id}`}
                    className="w-full mt-4 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group"
                >
                    Voir plus de détails <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </a>
            </div>
        </motion.div>
    );
};
