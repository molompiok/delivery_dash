import React from 'react';
import { X, ArrowUpRight, ArrowDownLeft, Clock, Calendar, Hash, Tag, Info, Receipt, User, Building } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction } from '../../../../api/types';

interface TransactionDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: Transaction | null;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ isOpen, onClose, transaction }) => {
    if (!isOpen || !transaction) return null;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(val).replace('XOF', 'F');
    };

    const isEarning = transaction.type === 'IN';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden"
                >
                    {/* Header with status Background */}
                    <div className={`h-32 flex items-center justify-center relative ${isEarning ? 'bg-emerald-500/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
                        <div className="absolute top-0 right-0 p-6">
                            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                <X size={20} className={isEarning ? 'text-emerald-600' : 'text-slate-400'} />
                            </button>
                        </div>
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${isEarning ? 'bg-white text-emerald-500' : 'bg-slate-900 text-white'}`}>
                            {isEarning ? <ArrowDownLeft size={32} /> : <ArrowUpRight size={32} />}
                        </div>
                    </div>

                    <div className="p-8 -mt-8 relative z-10">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-800 text-center space-y-2">
                            <h4 className="text-slate-400 font-bold text-xs uppercase tracking-widest">Montant de la Transaction</h4>
                            <div className="flex flex-col items-center">
                                <span className={`text-4xl font-black tabular-nums tracking-tighter ${isEarning ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                                    {isEarning ? '+' : '-'} {formatCurrency(Math.abs(transaction.amount))}
                                </span>
                                <div className={`mt-3 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${transaction.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                    • {transaction.fundsStatus}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
                                        <Calendar size={12} /> Date & Heure
                                    </p>
                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-bold text-sm">
                                        {new Date(transaction.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
                                        <Tag size={12} /> Catégorie
                                    </p>
                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-bold text-sm capitalize">
                                        {transaction.category.toLowerCase().replace('_', ' ')}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
                                    <Hash size={12} /> Référence de Transaction
                                </p>
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-bold text-sm tracking-widest text-indigo-500 bg-indigo-500/5 border border-indigo-500/10">
                                    {transaction.external_reference || transaction.id}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
                                    <Receipt size={12} /> Libellé / Description
                                </p>
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-bold text-sm">
                                    {transaction.label}
                                </div>
                            </div>

                            {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
                                        <Info size={12} /> Détails Additionnels
                                    </p>
                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl space-y-2">
                                        {Object.entries(transaction.metadata).map(([key, val]) => (
                                            <div key={key} className="flex justify-between text-xs border-b border-white/5 pb-1 last:border-0 last:pb-0">
                                                <span className="text-slate-400">{key}</span>
                                                <span className="font-bold">{String(val)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-10 flex gap-4">
                            <button className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-95 transition-all">
                                Télécharger le reçu
                            </button>
                            <button className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl hover:bg-slate-200 transition-colors">
                                Signaler
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
