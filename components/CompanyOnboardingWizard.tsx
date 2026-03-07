import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, User, Building2, ArrowRight, CheckCircle2, Loader2, Briefcase, FileText } from 'lucide-react';
import { authService } from '../api/auth';
import { companyService } from '../api/company';
import { User as UserType } from '../api/types';

interface CompanyOnboardingWizardProps {
    user: UserType;
    onComplete: () => void;
}

export default function CompanyOnboardingWizard({ user, onComplete }: CompanyOnboardingWizardProps) {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Step 1 Data
    const [fullName, setFullName] = useState(user.fullName || '');

    // Step 2 Data
    const [companyName, setCompanyName] = useState('');
    const [activityType, setActivityType] = useState('COMMANDE');
    const [registreCommerce, setRegistreCommerce] = useState('');

    const handleStep1 = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await authService.updateProfile({ fullName });
            setStep(2);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la mise à jour du profil');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStep2 = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await companyService.create({
                name: companyName,
                activityType,
                registreCommerce: registreCommerce || undefined
            });
            onComplete();
        } catch (err: any) {
            setError(err.response?.data?.message || "Erreur lors de la création de l'entreprise");
        } finally {
            setIsLoading(false);
        }
    };

    const activityTypes = [
        { id: 'COMMANDE', label: 'Livraison standard', icon: Truck, desc: 'Colis, repas, logistique urbaine.' },
        { id: 'VOYAGE', label: 'Transport (VTC)', icon: Briefcase, desc: 'Transport de personnes et trajets.' },
        { id: 'MISSION', label: 'Services & Missions', icon: FileText, desc: 'Services sur site, maintenance, etc.' },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden relative"
            >
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-800">
                    <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: `${(step / 2) * 100}%` }}
                        className="h-full bg-emerald-500"
                    />
                </div>

                <div className="p-8 md:p-12">
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="text-center space-y-2">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 mb-4">
                                        <User size={32} />
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 dark:text-white">Faisons connaissance</h2>
                                    <p className="text-slate-500 dark:text-slate-400">Pour commencer, comment devons-nous vous appeler ?</p>
                                </div>

                                <form onSubmit={handleStep1} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nom complet</label>
                                        <input
                                            autoFocus
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Jean Dupont"
                                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold text-lg"
                                            required
                                        />
                                    </div>

                                    {error && <p className="text-rose-500 text-sm font-bold text-center">{error}</p>}

                                    <button
                                        type="submit"
                                        disabled={isLoading || !fullName.trim()}
                                        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white font-bold text-lg shadow-xl transition-all disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" /> : <>Suivant <ArrowRight size={20} /></>}
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="text-center space-y-2">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 mb-4">
                                        <Building2 size={32} />
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 dark:text-white">Votre entreprise</h2>
                                    <p className="text-slate-500 dark:text-slate-400">Configurez votre environnement de travail.</p>
                                </div>

                                <form onSubmit={handleStep2} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nom de l'entreprise</label>
                                            <input
                                                autoFocus
                                                type="text"
                                                value={companyName}
                                                onChange={(e) => setCompanyName(e.target.value)}
                                                placeholder="Sublymus Logistics"
                                                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Registre du Commerce (optionnel)</label>
                                            <input
                                                type="text"
                                                value={registreCommerce}
                                                onChange={(e) => setRegistreCommerce(e.target.value)}
                                                placeholder="CI-ABJ-03-..."
                                                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Type d'activité principal</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {activityTypes.map((type) => {
                                                const Icon = type.icon;
                                                const isActive = activityType === type.id;
                                                return (
                                                    <button
                                                        key={type.id}
                                                        type="button"
                                                        onClick={() => setActivityType(type.id)}
                                                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 text-center ${isActive
                                                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                            : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:border-slate-200 dark:hover:border-slate-700'
                                                            }`}
                                                    >
                                                        <Icon size={24} />
                                                        <div>
                                                            <div className="text-xs font-black">{type.label}</div>
                                                            {/* <div className="text-[10px] opacity-70 leading-tight">{type.desc}</div> */}
                                                        </div>
                                                        {isActive && (
                                                            <motion.div layoutId="check" className="absolute top-2 right-2">
                                                                <CheckCircle2 size={16} />
                                                            </motion.div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {error && <p className="text-rose-500 text-sm font-bold text-center">{error}</p>}

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="px-8 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                        >
                                            Retour
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isLoading || !companyName.trim()}
                                            className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg shadow-xl shadow-emerald-500/20 transition-all disabled:opacity-50"
                                        >
                                            {isLoading ? <Loader2 className="animate-spin" /> : <>Terminer la configuration</>}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
