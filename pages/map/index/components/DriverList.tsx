import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Driver, DriverPosition } from '../../../../api/mock';

interface DriverListProps {
    drivers: Driver[];
    positions: DriverPosition[];
    activeDriverId: string | null;
    onSelectDriver: (id: string | null) => void;
    onOpenDetail: (id: string) => void;
}

export const DriverList: React.FC<DriverListProps> = ({
    drivers,
    positions,
    activeDriverId,
    onSelectDriver,
    onOpenDetail
}) => {
    return (
        <motion.div
            key="list"
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="space-y-2 h-full overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/50">
                    <span className="text-[10px] text-emerald-600 font-bold uppercase block mb-1">Actifs</span>
                    <span className="text-xl font-black text-emerald-700">{drivers.filter(d => d.status === 'ONLINE' || d.status === 'BUSY').length}</span>
                </div>
                <div className="bg-blue-50/50 p-2 rounded-xl border border-blue-100/50">
                    <span className="text-[10px] text-blue-600 font-bold uppercase block mb-1">En Course</span>
                    <span className="text-xl font-black text-blue-700">{drivers.filter(d => d.status === 'BUSY').length}</span>
                </div>
            </div>
            {drivers.map(driver => {
                const isActive = activeDriverId === driver.id;
                const livePos = positions.find(p => p.driverId === driver.id);
                const currentStatus = livePos?.status || driver.status;

                let statusColor = 'bg-gray-400';
                let statusText = 'Hors ligne';
                if (currentStatus === 'ONLINE') { statusColor = 'bg-emerald-500'; statusText = 'En attente'; }
                if (currentStatus === 'BUSY') { statusColor = 'bg-blue-500'; statusText = 'En course'; }
                if (currentStatus === 'PAUSE') { statusColor = 'bg-amber-500'; statusText = 'En pause'; }
                if (currentStatus === 'OFFLINE') { statusColor = 'bg-gray-400'; statusText = 'Hors ligne'; }

                return (
                    <div
                        key={driver.id}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border group relative overflow-hidden ${isActive ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                    >
                        <div
                            className="flex-1 flex items-center gap-3 cursor-pointer"
                            onClick={() => onSelectDriver(isActive ? null : driver.id)}
                        >
                            <div className="relative">
                                {driver.photo ? (
                                    <img src={driver.photo} alt={driver.lastName} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold border-2 border-white shadow-sm">
                                        {driver.firstName[0]}{driver.lastName[0]}
                                    </div>
                                )}
                                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${statusColor}`}></div>
                            </div>

                            <div>
                                <p className="text-sm font-bold text-gray-900 leading-tight">{driver.firstName} {driver.lastName}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1">
                                        {statusText}
                                    </span>
                                    <span className="text-[10px] text-gray-300">•</span>
                                    <span className="text-[10px] font-bold text-gray-500">{driver.mileage} km</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenDetail(driver.id);
                            }}
                            className="p-2 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                );
            })}
        </motion.div>
    );
};
