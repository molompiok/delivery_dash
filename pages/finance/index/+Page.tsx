import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    CreditCard, Tag, Eye, EyeOff, Download, Send, Plus,
    TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft,
    Calendar, Clock, DollarSign, ChevronRight, Activity,
    Globe, Layers, Calculator, Sparkles, ReceiptText, Wallet
} from 'lucide-react';
import { useHeaderAutoHide } from '../../../hooks/useHeaderAutoHide';
import { walletService } from '../../../api/wallet';
import { WalletGraph } from './components/WalletGraph';
import { RechargeModal, WithdrawModal, TransferModal } from './components/WalletActionModals';
import { Wallet as WalletType, Transaction, WalletStats } from '../../../api/types';
import { socketClient } from '../../../api/socket';

export default function Page() {
    const [isHidden, setIsHidden] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('hideWalletBalance') === 'true';
        }
        return false;
    });

    useEffect(() => {
        localStorage.setItem('hideWalletBalance', isHidden.toString());
    }, [isHidden]);
    const [period, setPeriod] = useState(7);
    const [loading, setLoading] = useState(true);
    const [wallets, setWallets] = useState<WalletType[]>([]);
    const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);
    const [stats, setStats] = useState<WalletStats | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Modal states
    const [activeModal, setActiveModal] = useState<'RECHARGE' | 'WITHDRAW' | 'TRANSFER' | null>(null);

    useHeaderAutoHide();

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedWallet) {
            fetchStatsAndTransactions();
        }
    }, [selectedWallet, period]);

    const fetchInitialData = async (silent = false) => {
        if (!silent) {
            setLoading(true);
        }
        try {
            const walletList = await walletService.listWallets();
            setWallets(walletList);
            if (walletList.length > 0) {
                // Prioritize company wallet for ETP dash
                const companyWallet = walletList.find(w => w.walletType === 'COMPANY') || walletList[0];
                setSelectedWallet(companyWallet);
            }
        } catch (error) {
            console.error('Failed to fetch wallets', error);
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    };

    const fetchStatsAndTransactions = async () => {
        if (!selectedWallet) return;
        try {
            const endDate = new Date().toISOString().split('T')[0];
            const startDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            const [statsRes, txRes] = await Promise.all([
                walletService.getStats(selectedWallet.id, startDate, endDate),
                walletService.getTransactions({ wallet_id: selectedWallet.id, limit: 5 })
            ]);

            setStats(statsRes);
            setTransactions(txRes.data || []);
        } catch (error) {
            console.error('Failed to fetch stats/transactions', error);
        }
    };

    useEffect(() => {
        socketClient.joinFleetRoomFromStorage();

        const scheduleSilentRefresh = () => {
            if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = setTimeout(() => {
                if (selectedWallet) {
                    fetchStatsAndTransactions();
                } else {
                    fetchInitialData(true);
                }
            }, 1200);
        };

        const offOrderStatus = socketClient.on('order_status_updated', scheduleSilentRefresh);
        const offRoute = socketClient.on('route_updated', scheduleSilentRefresh);
        const offOrderUpdated = socketClient.on('order_updated', scheduleSilentRefresh);

        return () => {
            offOrderStatus();
            offRoute();
            offOrderUpdated();
            if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        };
    }, [selectedWallet?.id, period]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(val).replace('XOF', 'F');
    };

    // Using real daily stats if available, otherwise fallback to generating trend based on totals
    const graphData = useMemo(() => {
        if (stats?.daily && stats.daily.length > 0) {
            return stats.daily.map(d => ({
                date: d.date,
                value: d.net
            }));
        }

        return Array.from({ length: period }).map((_, i) => ({
            date: `Day ${i}`,
            value: Math.max(0, (stats?.income || 0) / period * (0.5 + Math.random()))
        }));
    }, [stats, period]);

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4 md:px-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-1">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <a href="/" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-500 transition-colors">Accueil</a>
                        <ChevronRight className="text-slate-400" size={16} />
                        <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Gestion Financière</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Top Grid: Navigation Hub */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Abonnement Card */}
                <a
                    href="/finance/subscription"
                    className="group relative overflow-hidden rounded-[2.5rem] bg-indigo-600 p-6 md:p-8 h-52 shadow-2xl shadow-indigo-500/20 hover:scale-[1.02] transition-all cursor-pointer"
                >
                    {/* 3D Asset Background */}
                    <div className="absolute top-0 right-0 w-64 h-full group-hover:scale-110 transition-all duration-700 pointer-events-none">
                        {/* CSS Gradient Fade Left */}
                        <div className='relative'>
                            <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-indigo-600 to-transparent z-10"></div>
                            <img
                                src="/assets/subscription_card.png"
                                className="w-full h-full object-contain object-right"
                                alt=""
                            />
                        </div>
                    </div>

                    {/* Badge Absolute Top-Right */}
                    <div className="absolute top-6 right-6 z-20">
                        <div className="px-4 py-1.5 bg-emerald-400 text-emerald-900 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                            Actif
                        </div>
                    </div>

                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Offre Actuelle</p>
                            <h3 className="text-3xl font-black text-white leading-none">Sublymus Pro</h3>
                        </div>

                        <div>
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider">Prochain arrêt</span>
                                    <span className="text-sm font-bold text-white">01 Avr. 2024</span>
                                </div>
                                <div className="w-px h-8 bg-white/20"></div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider">Estimé</span>
                                    <span className="text-sm font-bold text-white">45 000 F</span>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-white/80 font-bold text-xs group-hover:text-white transition-colors">
                                Gérer <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </div>
                </a>

                {/* Tarif Card */}
                <a
                    href="/finance/pricing"
                    className="group relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-6 md:p-8 h-52 shadow-2xl shadow-slate-500/20 hover:scale-[1.02] transition-all cursor-pointer"
                >
                    {/* 3D Asset Background */}
                    <div className="absolute top-0 right-0 w-64 h-full group-hover:scale-110 transition-all duration-700 pointer-events-none">
                        <div className='relative'>
                            <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-slate-900 to-transparent z-10"></div>
                            <img
                                src="/assets/pricing_card.png"
                                className="w-full h-full object-contain object-right"
                                alt=""
                            />
                        </div>
                    </div>

                    {/* Badge Absolute Top-Right */}
                    <div className="absolute top-6 right-6 z-20">
                        <div className="px-4 py-1.5 bg-slate-800 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-700">
                            3 Actifs
                        </div>
                    </div>

                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Calcul des coûts</p>
                            <h3 className="text-3xl font-black text-white leading-none">Tarification</h3>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-black border border-emerald-500/30">MISSION</span>
                                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-[10px] font-black border border-blue-500/30">VOYAGE</span>
                            </div>
                            <div className="mt-4 flex items-center text-slate-400 font-bold text-xs group-hover:text-emerald-400 transition-colors">
                                Configurer <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </div>
                </a>
            </section>

            {/* Wallet Details (Driver-App Style) */}
            <section className="space-y-8 animate-in slide-in-from-bottom-8 duration-1000">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <CreditCard size={18} />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Portefeuille d'Exploitation</h2>
                </div>

                {/* Main Solde Card */}
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-6 md:p-10 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all"></div>

                    <div className="flex flex-col md:flex-row justify-between gap-10">
                        <div className="space-y-6 flex-1">
                            <div>
                                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-2">Solde Disponible</p>
                                <div className="flex items-center gap-4">
                                    <h3 className="text-6xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                                        {isHidden ? '•••••••• F' : formatCurrency(selectedWallet?.balanceAvailable || 0)}
                                    </h3>
                                    <button
                                        onClick={() => setIsHidden(!isHidden)}
                                        className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-indigo-500 transition-colors"
                                    >
                                        {isHidden ? <Eye size={24} /> : <EyeOff size={24} />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <div>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Comptable</p>
                                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                                        {isHidden ? '•••• F' : formatCurrency(selectedWallet?.balanceAccounting || 0)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Type</p>
                                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{selectedWallet?.walletType || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Devise</p>
                                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{selectedWallet?.currency || 'XOF'}</p>
                                </div>
                                <div className="flex items-end">
                                    <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-xs font-black uppercase tracking-widest">
                                        {selectedWallet?.isLocked ? 'VERROUILLÉ' : 'ACTIF'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-4 min-w-[240px]">
                            <button
                                onClick={() => setActiveModal('RECHARGE')}
                                className="flex items-center justify-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl hover:shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                <Plus size={20} />
                                Recharger
                            </button>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setActiveModal('WITHDRAW')}
                                    className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all group/btn"
                                >
                                    <Download className="text-orange-500 group-hover:scale-110 transition-transform" size={24} />
                                    <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">Retirer</span>
                                </button>
                                <button
                                    onClick={() => setActiveModal('TRANSFER')}
                                    className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all group/btn"
                                >
                                    <Send className="text-blue-500 group-hover:scale-110 transition-transform" size={24} />
                                    <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">Envoyer</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPIs Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entrées ({period} j)</p>
                            <h4 className="text-3xl font-black text-emerald-500 tabular-nums">
                                {isHidden ? '•••• F' : formatCurrency(stats?.income || 0)}
                            </h4>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                            <ArrowDownLeft size={32} />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-blue-500/30 transition-all">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sorties ({period} j)</p>
                            <h4 className="text-3xl font-black text-blue-500 tabular-nums">
                                {isHidden ? '•••• F' : formatCurrency(stats?.expense || 0)}
                            </h4>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                            <ArrowUpRight size={32} />
                        </div>
                    </div>
                </div>

                {/* Chart Evolution */}
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <header className="flex justify-between items-center mb-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-500/10 rounded-2xl text-indigo-500">
                                <Activity size={20} />
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 tracking-tight text-xl">Évolution des Flux</h3>
                        </div>
                        <div className="flex gap-2">
                            {[7, 15, 30].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${period === p ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 ring-4 ring-indigo-500/10' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100'}`}
                                >
                                    {p} j
                                </button>
                            ))}
                        </div>
                    </header>

                    <div className="h-64 w-full">
                        <WalletGraph data={graphData} period={period} />
                    </div>
                    <div className="flex justify-between mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                        <span>Il y a {period} jours</span>
                        <span>Aujourd'hui</span>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            Historique des Opérations
                            <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black text-slate-50">{transactions.length} Récentes</div>
                        </h3>
                        <a href="/finance/history" className="text-indigo-500 font-bold text-sm flex items-center gap-1 hover:underline">
                            Tout voir <ArrowUpRight size={16} />
                        </a>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {transactions.map(tx => (
                            <div
                                key={tx.id}
                                className="group/tx bg-white dark:bg-slate-900/50 p-4 md:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                            >
                                <div className="flex items-center gap-5">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${tx.type === 'IN' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-500'} group-hover/tx:scale-110 transition-all duration-500`}>
                                        {tx.type === 'IN' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                                    </div>
                                    <div>
                                        <h5 className="font-black text-slate-900 dark:text-white group-hover/tx:text-indigo-500 transition-colors">{tx.label}</h5>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{tx.external_reference || tx.id.slice(0, 8)}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 italic">
                                                <Calendar size={10} /> {new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-10">
                                    <div className="flex flex-col items-end">
                                        <span className={`text-xl font-black tabular-nums ${tx.type === 'IN' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                                            {tx.type === 'IN' ? '+' : '-'} {isHidden ? '•••• F' : formatCurrency(Math.abs(tx.amount))}
                                        </span>
                                        <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest mt-1 ${tx.status === 'COMPLETED' ? 'bg-slate-50 dark:bg-slate-800 text-slate-400' : 'bg-amber-500/10 text-amber-500'}`}>
                                            {tx.status}
                                        </div>
                                    </div>
                                    <ChevronRight className="text-slate-300 group-hover/tx:text-indigo-500 group-hover/tx:translate-x-1 transition-all" size={20} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Modals */}
                <RechargeModal
                    isOpen={activeModal === 'RECHARGE'}
                    onClose={() => setActiveModal(null)}
                    walletId={selectedWallet?.id || ''}
                    onSuccess={fetchInitialData}
                />
                <WithdrawModal
                    isOpen={activeModal === 'WITHDRAW'}
                    onClose={() => setActiveModal(null)}
                    walletId={selectedWallet?.id || ''}
                    currentBalance={selectedWallet?.balanceAvailable || 0}
                    onSuccess={fetchInitialData}
                />
                <TransferModal
                    isOpen={activeModal === 'TRANSFER'}
                    onClose={() => setActiveModal(null)}
                    walletId={selectedWallet?.id || ''}
                    onSuccess={fetchInitialData}
                    wallets={wallets}
                />

            </section>
        </div>
    );
}
