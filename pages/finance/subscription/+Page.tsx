import React from 'react';
import {
    Plus, Check, Sparkles, ReceiptText, Calendar,
    ArrowRight, CreditCard, ChevronRight, Activity,
    Globe, Layers, Calculator, ShieldCheck, Download,
    AlertCircle, TrendingUp, Info, Loader2
} from 'lucide-react';
import { useHeaderAutoHide } from '../../../hooks/useHeaderAutoHide';
import { subscriptionsService, SubscriptionRates, SubscriptionUsage, SubscriptionInvoice } from '../../../api/subscriptions';
import { DateTime } from 'luxon';

export default function Page() {
    useHeaderAutoHide();
    const [rates, setRates] = React.useState<SubscriptionRates | null>(null);
    const [usage, setUsage] = React.useState<SubscriptionUsage | null>(null);
    const [invoices, setInvoices] = React.useState<SubscriptionInvoice[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isUpdating, setIsUpdating] = React.useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [r, u, i] = await Promise.all([
                subscriptionsService.getEffectiveRates(),
                subscriptionsService.getUsage(),
                subscriptionsService.getInvoices({ limit: 12 })
            ]);
            setRates(r);
            setUsage(u);
            setInvoices(i);
        } catch (err) {
            console.error("Failed to fetch subscription data", err);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    const handleChangePlan = async (type: string) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir passer au forfait ${type} ? Les frais seront calculés au prorata.`)) return;

        setIsUpdating(true);
        try {
            await subscriptionsService.changePlan(type);
            await fetchData();
        } catch (err) {
            alert("Erreur lors du changement de forfait.");
            console.error(err);
        } finally {
            setIsUpdating(false);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(val).replace('XOF', 'F');
    };

    const formatDate = (iso: string) => {
        return DateTime.fromISO(iso).setLocale('fr').toFormat('dd MMMM yyyy');
    };

    const formatMonth = (iso: string) => {
        return DateTime.fromISO(iso).setLocale('fr').toFormat('MMMM yyyy');
    };

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
            </div>
        );
    }

    const currentUsage = usage?.usage;
    const baseAmount = rates?.baseAmount || 0;
    const commissionPercent = rates?.commandeCommissionPercent || 0;
    const ticketFeePercent = rates?.ticketFeePercent || 0;
    const taxPercent = rates?.taxPercent || 0;

    const commissionAmount = currentUsage ? Math.round((currentUsage.commandeUsageAmount * commissionPercent) / 100) : 0;
    const ticketAmount = currentUsage ? Math.round((currentUsage.ticketUsageAmount * ticketFeePercent) / 100) : 0;
    const subTotal = baseAmount + commissionAmount + ticketAmount;
    const taxAmount = Math.round((subTotal * taxPercent) / 100);
    const provisionalTotal = subTotal + taxAmount;

    const nextRenewal = DateTime.now().plus({ months: 1 }).startOf('month').setLocale('fr').toFormat('dd LLL.');

    const isOverdue = invoices.some(inv => inv.status === 'OVERDUE');

    return (
        <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4 md:px-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-1">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <a href="/finance" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-500 transition-colors">Finance</a>
                        <ChevronRight size={10} className="text-slate-400" />
                        <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Abonnement</span>
                        </div>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        Mon Contrat
                        <Sparkles className="text-indigo-500" size={32} />
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
                        Retrouvez les détails de votre offre, vos factures et votre consommation mensuelle.
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Current Plan & Usage */}
                <div className="lg:col-span-12 space-y-8">
                    {/* Active Plan Hero */}
                    <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-[3rem] p-6 md:p-10 text-white shadow-2xl shadow-cyan-500/30 relative overflow-hidden group">
                        {/* 3D Asset Background */}
                        <div className="absolute top-0 right-0 w-[100%] h-[120%] -translate-y-[10%] group-hover:scale-105 transition-all duration-1000 pointer-events-none opacity-90">
                            <div className='relative w-full h-full'>
                                <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-gray-900 to-transparent z-10"></div>
                                <img
                                    src="/assets/green_blue_glass_shape.png"
                                    className="w-full h-full object-cover object-right"
                                    alt="3D glass shape"
                                />
                            </div>
                        </div>
                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20">
                                        <ShieldCheck size={28} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Plan Actuel</span>
                                        <h2 className="text-4xl font-black">Sublymus {rates?.activityType === 'COMMANDE' ? 'Marketplace' : 'Enterprise'}</h2>
                                    </div>
                                </div>
                                <p className="text-teal-50 leading-relaxed font-medium">
                                    {rates?.activityType === 'COMMANDE'
                                        ? "Gérez vos commandes e-commerce avec une intégration fluide et des outils logistiques performants."
                                        : "Optimisé pour les flottes professionnelles avec gestion multi-sites et analytics avancés."}
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <span className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-black uppercase border border-white/20">Multi-Utilisateurs</span>
                                    <span className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-black uppercase border border-white/20">API Access</span>
                                    <span className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-black uppercase border border-white/20">Support 24/7</span>
                                </div>
                            </div>

                            <div className="bg-white/10 rounded-[2.5rem] p-6 md:p-8 backdrop-blur-md border border-white/10 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-teal-100 text-[10px] font-black uppercase tracking-widest">Coût Fixe</p>
                                        <p className="text-3xl font-black">{formatCurrency(baseAmount)} <span className="text-xs opacity-60">/ mois</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-teal-100 text-[10px] font-black uppercase tracking-widest">Statut</p>
                                        <p className={`text-sm font-black uppercase tracking-widest ${isOverdue ? 'text-rose-300' : 'text-emerald-300'}`}>
                                            {isOverdue ? 'Facture Impayée' : 'En règle'}
                                        </p>
                                    </div>
                                </div>
                                <div className="h-px bg-white/20 my-4"></div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-teal-100 text-[10px] font-black uppercase tracking-widest">Identifiant Contrat</p>
                                        <p className="text-xl font-bold truncate max-w-[150px]">{rates?.source.planId}</p>
                                    </div>
                                    <a
                                        href="/finance/subscription/plans"
                                        className="relative z-10  text-teal-700 px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-xl shadow-black/10 hover:shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap overflow-hidden border border-white/50"
                                    >
                                        <span className="relative z-10">Changer le forfait</span>
                                        <ArrowRight size={16} className="relative z-10 hidden sm:block" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Real-time Consumption */}
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                        <header className="flex justify-between items-center px-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-amber-500/10 rounded-2xl text-amber-500">
                                    <TrendingUp size={20} />
                                </div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-100 tracking-tight text-xl">Consommation du Mois ({DateTime.now().setLocale('fr').toFormat('LLLL')})</h3>
                            </div>
                            <div className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase">
                                Calcul en temps réel
                            </div>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Fixed fee progress - always at 100% */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-bold text-slate-600">Base Abonnement</span>
                                    <span className="text-xl font-black">{formatCurrency(baseAmount)}</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full w-full bg-slate-400 rounded-full"></div>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Forfait fixe mensuel</p>
                            </div>

                            {/* Commissions Estimate */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-bold text-slate-600">Commissions ({commissionPercent}%)</span>
                                    <span className="text-xl font-black text-indigo-500">{formatCurrency(commissionAmount)}</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full w-[65%] bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Basé sur {formatCurrency(currentUsage?.commandeUsageAmount || 0)} de CA</p>
                            </div>

                            {/* Extras / Over-usage */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-bold text-slate-600">Tickets & Services ({ticketFeePercent}%)</span>
                                    <span className="text-xl font-black text-emerald-500">{formatCurrency(ticketAmount)}</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full w-[30%] bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Volume : {formatCurrency(currentUsage?.ticketUsageAmount || 0)}</p>
                            </div>
                        </div>

                        <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                                    <Calculator className="text-slate-400" size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">Total Provisoire</h4>
                                    <p className="text-xs text-slate-500 font-medium">Incluant taxes (TVA {taxPercent}%) estimées</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(provisionalTotal)}</span>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">Prochaine facture : {nextRenewal}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Invoice History */}
                <div className="lg:col-span-12 space-y-6">
                    <div className="flex justify-between items-center px-4">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            Historique des Factures
                            <ReceiptText className="text-slate-400" size={24} />
                        </h3>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 md:px-8 py-4 md:py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Période</th>
                                    <th className="px-6 md:px-8 py-4 md:py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                                    <th className="px-6 md:px-8 py-4 md:py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Détail</th>
                                    <th className="px-6 md:px-8 py-4 md:py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut</th>
                                    <th className="px-6 md:px-8 py-4 md:py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Montant</th>
                                    <th className="px-6 md:px-8 py-4 md:py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {invoices.map(inv => (
                                    <tr key={inv.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 md:px-8 py-6 md:py-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:bg-indigo-500/10 group-hover:text-indigo-500 transition-all">
                                                    <Calendar size={18} />
                                                </div>
                                                <span className="font-bold text-slate-900 dark:text-white">{formatMonth(inv.periodStart)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 md:px-8 py-6 md:py-8">
                                            {inv.metadata?.historySnapshot?.length > 1 ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                                                    <Layers size={12} />
                                                    Prorata (Mixte)
                                                </span>
                                            ) : (
                                                <span className="inline-flex px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                                                    {inv.activityTypeSnapshot === 'VOYAGE' ? 'Enterprise' : 'Marketplace'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 md:px-8 py-6 md:py-8 text-sm font-medium text-slate-500">
                                            Base: {formatCurrency(inv.baseAmount)} <br />
                                            <span className="text-[10px] text-slate-400">
                                                Commissions: {formatCurrency(inv.commandeCommissionAmount)}
                                                {inv.ticketFeeAmount > 0 ? ` + Tickets: ${formatCurrency(inv.ticketFeeAmount)}` : ''}
                                            </span>
                                        </td>
                                        <td className="px-6 md:px-8 py-6 md:py-8">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' : inv.status === 'OVERDUE' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                {inv.status === 'PAID' ? 'Payée' : inv.status === 'OVERDUE' ? 'Retard' : 'Émise'}
                                            </span>
                                        </td>
                                        <td className="px-6 md:px-8 py-6 md:py-8 text-right font-black text-slate-900 dark:text-white text-lg">
                                            {formatCurrency(inv.totalAmountWithTax)}
                                        </td>
                                        <td className="px-6 md:px-8 py-6 md:py-8 text-right">
                                            <button className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-indigo-500 hover:bg-white dark:hover:bg-slate-700 shadow-sm border border-transparent hover:border-slate-100 transition-all">
                                                <Download size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
