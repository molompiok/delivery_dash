import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Package, User, Clock, CheckCircle2 } from 'lucide-react';

interface StopEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedStop: any) => void;
    stop: any;
}

export const StopEditModal: React.FC<StopEditModalProps> = ({
    isOpen,
    onClose,
    onSave,
    stop
}) => {
    const [editedStop, setEditedStop] = useState<any>(null);

    useEffect(() => {
        if (stop) {
            setEditedStop(JSON.parse(JSON.stringify(stop)));
        }
    }, [stop]);

    if (!editedStop) return null;

    const handleSave = () => {
        onSave(editedStop);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">Modifier le passage</h3>
                                    <p className="text-sm text-gray-400 font-medium font-mono uppercase">{editedStop.id}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                            {/* Address Section */}
                            <section>
                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <MapPin size={12} /> Localisation
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase ml-1 mb-1 block">Rue</label>
                                        <input
                                            type="text"
                                            value={editedStop.address.street}
                                            onChange={(e) => setEditedStop({ ...editedStop, address: { ...editedStop.address, street: e.target.value } })}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase ml-1 mb-1 block">Ville</label>
                                        <input
                                            type="text"
                                            value={editedStop.address.city}
                                            onChange={(e) => setEditedStop({ ...editedStop, address: { ...editedStop.address, city: e.target.value } })}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase ml-1 mb-1 block">État / Province</label>
                                        <input
                                            type="text"
                                            value={editedStop.address.state}
                                            onChange={(e) => setEditedStop({ ...editedStop, address: { ...editedStop.address, state: e.target.value } })}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Actions & Products Section */}
                            <section>
                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Package size={12} /> Actions & Articles
                                </h4>
                                <div className="space-y-4">
                                    {editedStop.actions.map((action: any, idx: number) => (
                                        <div key={action.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start justify-between">
                                            <div className="flex gap-4">
                                                <div className={`p-2.5 rounded-xl ${action.type === 'Collect' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    <Package size={18} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-gray-900">{action.product.name}</div>
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase">
                                                        {action.type} • {action.product.dimensions?.weight}kg
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                                                    {action.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    <button className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-[11px] font-black text-gray-400 uppercase tracking-widest hover:border-blue-200 hover:text-blue-500 hover:bg-blue-50/50 transition-all">
                                        + Ajouter une action
                                    </button>
                                </div>
                            </section>

                            {/* Client & Timing */}
                            <section>
                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <User size={12} /> Informations Client
                                </h4>
                                <div className="bg-blue-50/30 p-4 rounded-3xl border border-blue-50 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <img src={editedStop.client.avatar} alt={editedStop.client.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                                        <div>
                                            <div className="text-base font-black text-gray-900">{editedStop.client.name}</div>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-tighter">
                                                <Clock size={12} /> Ouverture: {editedStop.opening?.start && new Date(editedStop.opening.start).toLocaleTimeString([], { hour: '2h', minute: '2h' })} - {editedStop.opening?.end && new Date(editedStop.opening.end).toLocaleTimeString([], { hour: '2h', minute: '2h' })}
                                            </div>
                                        </div>
                                    </div>
                                    <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                                        Message
                                    </button>
                                </div>
                            </section>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-50 bg-white flex gap-4">
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-[2] px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={18} />
                                Enregistrer les modifications
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
