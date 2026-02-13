import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2, Package } from 'lucide-react';
import { Driver } from '../../../../api/mock';

interface DriverDetailProps {
    driver: Driver;
    orders: any[];
    loading: boolean;
    onBack: () => void;
}

export const DriverDetail: React.FC<DriverDetailProps> = ({
    driver,
    orders,
    loading,
    onBack
}) => {
    if (loading || !driver) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-100 rounded-full blur-xl animate-pulse"></div>
                    <Loader2 className="animate-spin text-emerald-600 relative z-10" size={32} />
                </div>
                <p className="text-xs text-gray-400 font-medium animate-pulse">Chargement des détails...</p>
            </div>
        );
    }

    return (
        <motion.div
            key="detail"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="h-full flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 mb-4 font-medium text-xs uppercase tracking-wide group"
            >
                <div className="p-1 bg-gray-100 dark:bg-slate-800 rounded-lg group-hover:bg-gray-200 dark:group-hover:bg-slate-700 transition-colors">
                    <ChevronLeft size={14} />
                </div>
                Retour à la liste
            </button>

            <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-xl font-bold text-gray-400 shadow-inner overflow-hidden">
                        {driver.photo ? (
                            <img src={driver.photo} alt={driver.lastName} className="w-full h-full rounded-2xl object-cover" />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl">
                                {driver.firstName?.[0] || ''}{driver.lastName?.[0] || ''}
                            </div>
                        )}
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900 dark:text-slate-100">{driver.firstName} {driver.lastName}</h2>
                        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">ID: {driver.id}</p>
                        <div className="flex gap-2 mt-2">
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 rounded text-[10px] font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider">{driver.status}</span>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800">
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase mb-1">Commandes</p>
                        <p className="text-xl font-black text-gray-900 dark:text-slate-100">{orders.length}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800">
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase mb-1">Km du jour</p>
                        <p className="text-xl font-black text-gray-900 dark:text-slate-100">{driver.mileage}</p>
                    </div>
                </div>

                {/* Active Orders List */}
                <div>
                    <h3 className="text-xs font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider mb-3 flex items-center justify-between">
                        Commandes en cours
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">{orders.filter(o => o.status !== 'DELIVERED').length}</span>
                    </h3>

                    <div className="space-y-3">
                        {orders.length > 0 ? (
                            orders.slice(0, 3).map(order => (
                                <div key={order.id} className="p-3 bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-xl shadow-sm hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold text-gray-900 dark:text-slate-100">{order.id}</span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${order.status === 'DELIVERED' ? 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>{order.status}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                        <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate">{order.pickupAddress?.formattedAddress || order.pickupAddress}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                        <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate">{order.deliveryAddress?.formattedAddress || order.deliveryAddress}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 text-gray-300 dark:text-slate-700">
                                <Package size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-xs">Aucune commande active</p>
                            </div>
                        )}
                    </div>

                    <a
                        style={{ textDecoration: 'none', color: 'white' }}
                        href={`/orders?driver_id=${driver.id}`}
                        className="w-full mt-4 py-2 bg-gray-900 dark:bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-800 dark:hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                        Voir tout <ChevronRight size={14} />
                    </a>
                </div>
            </div>
        </motion.div>
    );
};
