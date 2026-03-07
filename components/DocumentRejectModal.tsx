import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Send } from 'lucide-react';

interface DocumentRejectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (comment: string) => void;
    title: string;
    description: string;
    isSubmitting?: boolean;
}

export const DocumentRejectModal: React.FC<DocumentRejectModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    isSubmitting = false
}) => {
    const [comment, setComment] = useState('');

    const handleConfirm = () => {
        onConfirm(comment);
        setComment('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
                    >
                        <div className="p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl">
                                    <AlertTriangle size={24} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase italic tracking-tighter">{title}</h3>
                            </div>

                            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-6">
                                {description}
                            </p>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-2">
                                    Motif du refus (optionnel)
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Ex: Image illisible, document expiré..."
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none transition-all min-h-[100px] resize-none text-slate-900 dark:text-slate-100"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-6 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isSubmitting}
                                    className="flex-1 px-6 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-rose-200 dark:shadow-none flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Send size={14} />
                                            <span>Confirmer le refus</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                        >
                            <X size={18} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
