import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Play, Info, Mail, Phone, MessageSquare } from 'lucide-react';

export interface TutorialData {
    title?: string;
    description?: string;
    tuto_video?: string;
    preview?: string;
}

interface TutorialOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    tutorial: TutorialData | null;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ isOpen, onClose, tutorial }) => {
    const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'support@sublymus.com';
    const supportPhone = import.meta.env.VITE_SUPPORT_PHONE || '';

    if (!isOpen) return null;

    // Case: No data at all
    if (!tutorial || (!tutorial.preview && !tutorial.tuto_video)) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-white/20 shadow-2xl p-8 max-w-sm w-full text-center space-y-6"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                            <Info size={40} className="text-amber-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Tutoriel non disponible</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                                Ce tutoriel est en cours de préparation. Contactez notre service client pour toute assistance.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 pt-4">
                            {supportEmail && (
                                <a href={`mailto:${supportEmail}`} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 transition-colors">
                                    <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                                        <Mail size={16} className="text-slate-400" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{supportEmail}</p>
                                    </div>
                                </a>
                            )}
                            {supportPhone && (
                                <a href={`tel:${supportPhone}`} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 transition-colors">
                                    <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                                        <Phone size={16} className="text-slate-400" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Téléphone</p>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{supportPhone}</p>
                                    </div>
                                </a>
                            )}
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:opacity-90 transition-opacity"
                        >
                            Fermer
                        </button>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-xl"
                onClick={onClose}
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all z-10"
                >
                    <X size={24} />
                </button>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    className="max-w-4xl w-full flex flex-col md:flex-row bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl border border-white/10"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Preview Area */}
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 relative group overflow-hidden min-h-[300px] flex items-center justify-center">
                        {tutorial.preview ? (
                            tutorial.preview.endsWith('.mp4') || tutorial.preview.endsWith('.webm') ? (
                                <video
                                    src={tutorial.preview}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <img
                                    src={tutorial.preview}
                                    className="w-full h-full object-contain"
                                    alt={tutorial.title}
                                />
                            )
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-slate-400">
                                <Play size={64} strokeWidth={1} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Vidéo disponible</span>
                            </div>
                        )}

                        {tutorial.tuto_video && !tutorial.preview && (
                            <a
                                href={tutorial.tuto_video}
                                target="_blank"
                                rel="noreferrer"
                                className="absolute inset-0 flex items-center justify-center bg-slate-900/20 group-hover:bg-slate-900/40 transition-all"
                            >
                                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white scale-90 group-hover:scale-100 transition-transform">
                                    <Play size={32} fill="white" />
                                </div>
                            </a>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="w-full md:w-80 p-8 flex flex-col justify-between bg-white dark:bg-slate-900 border-l border-white/10">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="p-2 bg-emerald-500/10 rounded-xl w-fit">
                                    <Play size={20} className="text-emerald-500" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                    {tutorial.title || 'Tutoriel'}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
                                    {tutorial.description}
                                </p>
                            </div>
                        </div>

                        <div className="pt-8 space-y-3">
                            {tutorial.tuto_video && (
                                <a
                                    href={tutorial.tuto_video}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                                >
                                    <ExternalLink size={16} />
                                    Voir en détail
                                </a>
                            )}
                            <button
                                onClick={onClose}
                                className="w-full py-4 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
