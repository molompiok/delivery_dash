import React, { useEffect, useState } from 'react';
import {
    Sparkles, Check, ArrowRight,
    Layers, Globe, Activity, Loader2
} from 'lucide-react';
import { navigate } from 'vike/client/router';
import { subscriptionsService, SubscriptionRates } from '../../../../api/subscriptions';

export default function PlansPage() {
    const [currentRates, setCurrentRates] = useState<SubscriptionRates | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        const fetchCurrentPlan = async () => {
            try {
                const rates = await subscriptionsService.getEffectiveRates();
                setCurrentRates(rates);
            } catch (err) {
                console.error("Failed to load current subscription:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCurrentPlan();
    }, []);

    const handleSelectPlan = async (type: string) => {
        if (currentRates?.activityType === type) {
            navigate('/finance/subscription');
            return;
        }

        const planNames: Record<string, string> = {
            'COMMANDE': 'Livraison & VTC',
            'MISSION': 'Mission & Ronde',
            'VOYAGE': 'Voyage & Transport'
        };

        if (!window.confirm(`Vous êtes sur le point de passer à l'offre ${planNames[type]}. Le changement prendra effet immédiatement et votre prochaine facture sera calculée au prorata. Confirmer ?`)) {
            return;
        }

        setIsUpdating(true);
        try {
            await subscriptionsService.changePlan(type);
            alert("Votre abonnement a été mis à jour avec succès.");
            navigate('/finance/subscription');
        } catch (err: any) {
            alert(`Erreur : ${err.response?.data?.message || err.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
            </div>
        );
    }

    const currentType = currentRates?.activityType || 'COMMANDE';

    return (
        <div className="max-w-[1400px] mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32 px-4 md:px-8 mt-10">
            {/* Header */}
            <header className="text-center space-y-4 max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-4">
                    <Sparkles size={14} className="text-indigo-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Offres & Tarifs</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                    Des forfaits adaptés à <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-500">
                        votre cœur de métier.
                    </span>
                </h1>
                <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
                    Que vous fassiez de la livraison rapide, des rondes de sécurité planifiées ou du transport interurbain, Sublymus a le moteur opérationnel qu'il vous faut.
                </p>
            </header>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-16">

                {/* COMMANDE - Livraison & VTC */}
                <div className={`relative bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-8 border-2 transition-all duration-300 ${currentType === 'COMMANDE' ? 'border-indigo-500 ring-4 ring-indigo-500/10 shadow-2xl shadow-indigo-500/20 shadow-y-xl scale-[1.02]' : 'border-slate-100 dark:border-slate-800 hover:border-indigo-300 shadow-sm'}`}>
                    {currentType === 'COMMANDE' && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg z-10">
                            Forfait Actuel
                        </div>
                    )}
                    <div className="space-y-6">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-6 border border-indigo-100 dark:border-indigo-500/20">
                            <Layers size={28} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">LIVRAISON & VTC</h3>
                            <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed h-10">Pour les flottes de coursiers urbains, coursiers express, e-commerce et restauration.</p>
                        </div>
                        <div className="py-6 border-y border-slate-100 dark:border-slate-800 space-y-2">
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">15 000</span>
                                <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">FCFA <span className="text-[10px]">/ mois</span></span>
                            </div>
                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold mt-3">
                                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-md text-[10px] uppercase tracking-widest">+ 2.5%</span>
                                <span className="text-xs text-slate-500 font-medium">de frais sur le CA généré</span>
                            </div>
                        </div>

                        <ul className="space-y-3 pt-4 h-56">
                            {[
                                "Création manuelle de commandes",
                                "Affectation automatique aux livreurs",
                                "Suivi GPS en temps réel partagé",
                                "Paiement en ligne (Wave / Orange Money)",
                                "Tableau de bord financier"
                            ].map((feat, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                    <span className="text-slate-600 dark:text-slate-300 font-medium text-xs leading-tight">{feat}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleSelectPlan('COMMANDE')}
                            disabled={isUpdating || currentType === 'COMMANDE'}
                            className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 ${currentType === 'COMMANDE' ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-slate-900 dark:bg-white dark:text-slate-900 text-white hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 shadow-xl hover:scale-[1.02] active:scale-95'}`}
                        >
                            {isUpdating ? <Loader2 size={16} className="animate-spin" /> : currentType === 'COMMANDE' ? 'Forfait Actif' : 'Choisir Livraison'}
                            {currentType !== 'COMMANDE' && !isUpdating && <ArrowRight size={16} />}
                        </button>
                    </div>
                </div>

                {/* MISSION - Rondes & Interventions */}
                <div className={`relative bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-8 border-2 transition-all duration-300 ${currentType === 'MISSION' ? 'border-emerald-500 ring-4 ring-emerald-500/10 shadow-2xl shadow-emerald-500/20 shadow-y-xl scale-[1.02]' : 'border-slate-100 dark:border-slate-800 hover:border-emerald-300 shadow-sm'}`}>
                    {currentType === 'MISSION' && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg z-10">
                            Forfait Actuel
                        </div>
                    )}
                    <div className="space-y-6 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6 border border-emerald-100 dark:border-emerald-500/20">
                            <Activity size={28} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">MISSION & RONDE</h3>
                            <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed h-10">Optimisé pour les rondes de sécurité, techniciens, ou livraisons planifiées multi-arrêts.</p>
                        </div>
                        <div className="py-6 border-y border-slate-100 dark:border-slate-800 space-y-2">
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">50 000</span>
                                <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">FCFA <span className="text-[10px]">/ mois</span></span>
                            </div>
                            <div className="flex flex-col gap-1 mt-3">
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-md text-[10px] uppercase tracking-widest">+ 1.5%</span>
                                    <span className="text-xs text-slate-500 font-medium">de frais sur le CA généré</span>
                                </div>
                            </div>
                        </div>

                        <ul className="space-y-3 pt-4 h-56">
                            {[
                                "Inclus toutes les options de Livraison",
                                "Moteur d'optimisation (OR-Tools)",
                                "Création de tournées intelligentes (TSP/VRP)",
                                "Tableau de dispatch avancé",
                                "Rapports d'intervention détaillés",
                            ].map((feat, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                    <span className="text-slate-600 dark:text-slate-300 font-medium text-xs leading-tight">{feat}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleSelectPlan('MISSION')}
                            disabled={isUpdating || currentType === 'MISSION'}
                            className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 ${currentType === 'MISSION' ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-slate-900 dark:bg-white dark:text-slate-900 text-white hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 shadow-xl hover:scale-[1.02] active:scale-95'}`}
                        >
                            {isUpdating ? <Loader2 size={16} className="animate-spin" /> : currentType === 'MISSION' ? 'Forfait Actif' : 'Choisir Missions'}
                            {currentType !== 'MISSION' && !isUpdating && <ArrowRight size={16} />}
                        </button>
                    </div>
                </div>

                {/* VOYAGE - Transport */}
                <div className={`relative bg-slate-900 rounded-[3rem] p-8 md:p-8 border-2 transition-all duration-300 overflow-hidden ${currentType === 'VOYAGE' ? 'border-purple-500 ring-4 ring-purple-500/20 shadow-2xl shadow-purple-500/30 scale-[1.02]' : 'border-slate-800 hover:border-purple-500/50'}`}>
                    <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

                    {currentType === 'VOYAGE' && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg z-10">
                            Forfait Actuel
                        </div>
                    )}

                    <div className="space-y-6 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur border border-white/10 flex items-center justify-center text-purple-400 mb-6">
                            <Globe size={28} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tight">VOYAGE & TRANSPORT</h3>
                            <p className="text-xs text-slate-400 font-medium mt-2 leading-relaxed h-10">La plateforme ultime pour la billetterie et la logistique de cars, soutes et bagages interurbains.</p>
                        </div>
                        <div className="py-6 border-y border-white/10 space-y-2">
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-white tracking-tighter">100 000</span>
                                <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">FCFA <span className="text-[10px]">/ mois</span></span>
                            </div>
                            <div className="flex flex-col gap-2 mt-3">
                                <div className="flex items-center gap-2 text-purple-400 font-bold">
                                    <span className="px-2 py-0.5 bg-purple-500/20 rounded-md text-[10px] uppercase tracking-widest">+ 1.0%</span>
                                    <span className="text-xs text-slate-300 font-medium">sur le Fret en Soute</span>
                                </div>
                                <div className="flex items-center gap-2 text-purple-400 font-bold">
                                    <span className="px-2 py-0.5 bg-purple-500/20 rounded-md text-[10px] uppercase tracking-widest">+ 0.5%</span>
                                    <span className="text-xs text-slate-300 font-medium">sur les tickets de Voyage</span>
                                </div>
                            </div>
                        </div>

                        <ul className="space-y-3 pt-4 h-56">
                            {[
                                "Inclus toutes les options Mission/Livraison",
                                "Billetterie en ligne + Choix du siège (3D)",
                                "Gestion des gares et dispatch interurbain",
                                "API ouverte pour agrégateurs de voyages",
                                "Accompagnement Account Manager Dédié",
                            ].map((feat, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                    <span className="text-slate-300 font-medium text-xs leading-tight">{feat}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleSelectPlan('VOYAGE')}
                            disabled={isUpdating || currentType === 'VOYAGE'}
                            className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 ${currentType === 'VOYAGE' ? 'bg-white/5 text-slate-500 cursor-not-allowed' : 'bg-purple-500 text-white hover:bg-purple-400 shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-95'}`}
                        >
                            {isUpdating ? <Loader2 size={16} className="animate-spin" /> : currentType === 'VOYAGE' ? 'Forfait Actif' : 'Choisir Transport'}
                            {currentType !== 'VOYAGE' && !isUpdating && <ArrowRight size={16} />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="text-center mt-12 text-slate-400 text-xs font-bold tracking-widest uppercase">
                Besoin d'aide ? <a href="#" className="text-indigo-500 hover:text-indigo-400 transition-colors underline underline-offset-4 ml-1">Contactez le support</a>
            </div>
        </div>
    );
}
