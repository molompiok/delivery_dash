import React, { useState, useEffect, useMemo } from 'react';
import {
    ChevronLeft, Search, Filter, Calendar, ArrowUpRight, ArrowDownLeft,
    Download, ListFilter, RefreshCcw, MoreHorizontal, ChevronRight,
    CreditCard, Wallet, Layers, FilterX, Clock, Eye, EyeOff
} from 'lucide-react';
import { useHeaderAutoHide } from '../../../hooks/useHeaderAutoHide';
import { walletService } from '../../../api/wallet';
import { Transaction, Wallet as WalletType } from '../../../api/types';
import { TransactionDetailModal } from './components/TransactionDetailModal';

export default function HistoryPage() {
    const [loading, setLoading] = useState(true);
    const [wallets, setWallets] = useState<WalletType[]>([]);
    const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [category, setCategory] = useState<string>('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(1);

    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const [isHidden, setIsHidden] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('hideWalletBalance') === 'true';
        }
        return false;
    });

    useEffect(() => {
        localStorage.setItem('hideWalletBalance', isHidden.toString());
    }, [isHidden]);

    useHeaderAutoHide();

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedWallet) {
            fetchTransactions();
        }
    }, [selectedWallet, category, startDate, endDate, page]);

    const fetchInitialData = async () => {
        try {
            const walletList = await walletService.listWallets();
            setWallets(walletList);
            if (walletList.length > 0) {
                const companyWallet = walletList.find(w => w.walletType === 'COMPANY') || walletList[0];
                setSelectedWallet(companyWallet);
            }
        } catch (error) {
            console.error('Failed to load wallets', error);
        }
    };

    const fetchTransactions = async () => {
        if (!selectedWallet) return;
        setLoading(true);
        try {
            const params = {
                wallet_id: selectedWallet.id,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                category: category === 'ALL' ? undefined : category,
                page,
                limit: 50
            };
            const res = await walletService.getTransactions(params);
            setTransactions(res.data || []);
        } catch (error) {
            console.error('Failed to fetch transactions', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = useMemo(() => {
        if (!searchQuery) return transactions;
        const q = searchQuery.toLowerCase();
        return transactions.filter(tx =>
            tx.label.toLowerCase().includes(q) ||
            tx.external_reference?.toLowerCase().includes(q) ||
            tx.id.toLowerCase().includes(q)
        );
    }, [transactions, searchQuery]);

    const categories = [
        { label: 'Tous', value: 'ALL' },
        { label: 'Recharges', value: 'DEPOSIT' },
        { label: 'Retraits', value: 'PAYOUT' },
        { label: 'Transferts', value: 'TRANSFER' },
        { label: 'Paiements', value: 'PAYMENT' },
        { label: 'Remboursements', value: 'REFUND' },
    ];

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(val).replace('XOF', 'F');
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4 md:px-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <a href="/finance" className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 transition-colors shadow-sm">
                        <ChevronLeft size={20} />
                    </a>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Historique Financier</h1>
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Audit complet des transactions</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsHidden(!isHidden)}
                        className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-indigo-500 transition-colors shadow-sm"
                        title={isHidden ? "Afficher les montants" : "Masquer les montants"}
                    >
                        {isHidden ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                    <button onClick={fetchTransactions} className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:rotate-180 transition-all duration-500 shadow-sm">
                        <RefreshCcw size={20} className="text-slate-400" />
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all hidden md:flex">
                        <Download size={16} /> Exporter .CSV
                    </button>
                </div>
            </header>

            {/* Filter Hub */}
            <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Wallet Selector */}
                    <div className="md:col-span-1 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 px-1 uppercase tracking-widest">Portefeuille</label>
                        <select
                            value={selectedWallet?.id || ''}
                            onChange={(e) => setSelectedWallet(wallets.find(w => w.id === e.target.value) || null)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 font-bold text-sm focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        >
                            {wallets.map(w => (
                                <option key={w.id} value={w.id}>{w.label || w.entityType === 'COMPANY' ? 'Business' : 'Personnel'} ({w.currency})</option>
                            ))}
                        </select>
                    </div>

                    {/* Search */}
                    <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 px-1 uppercase tracking-widest">Rechercher</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Référence, libellé, ID..."
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-12 pr-4 py-4 font-bold text-sm focus:ring-4 focus:ring-indigo-500/10 transition-all"
                            />
                        </div>
                    </div>

                    {/* Date Toggle - Placeholder for simplistic range */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 px-1 uppercase tracking-widest">Période</label>
                        <div className="flex bg-slate-50 dark:bg-slate-800 rounded-2xl p-1 gap-1">
                            <button className="flex-1 py-3 px-4 rounded-xl text-xs font-black bg-white dark:bg-slate-900 shadow-sm">Tout</button>
                            <button className="flex-1 py-3 px-4 rounded-xl text-xs font-black text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Filtres</button>
                        </div>
                    </div>
                </div>

                {/* Category Chips */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
                    {categories.map(cat => (
                        <button
                            key={cat.value}
                            onClick={() => setCategory(cat.value)}
                            className={`px-5 py-2.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${category === cat.value ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* List */}
            <section className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 space-y-4">
                        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Chargement des transactions...</p>
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-20 text-center space-y-4 border border-slate-100 dark:border-slate-800">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto text-slate-300">
                            <FilterX size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Aucune transaction trouvée</h3>
                        <p className="text-slate-500 text-sm max-w-xs mx-auto">Ajustez vos filtres ou relancez la recherche pour obtenir des résultats.</p>
                        <button onClick={() => { setCategory('ALL'); setSearchQuery(''); }} className="text-indigo-600 font-bold text-sm">Réinitialiser les filtres</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {filteredTransactions.map(tx => (
                            <div
                                key={tx.id}
                                onClick={() => { setSelectedTx(tx); setIsDetailOpen(true); }}
                                className="group/tx bg-white dark:bg-slate-900/50 p-4 md:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer"
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${tx.type === 'IN' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'} group-hover/tx:scale-110 transition-all duration-500`}>
                                        {tx.type === 'IN' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                                    </div>
                                    <div>
                                        <h5 className="font-black text-slate-900 dark:text-white group-hover/tx:text-indigo-500 transition-colors">{tx.label}</h5>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md">{tx.category}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                <Clock size={10} /> {new Date(tx.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-12">
                                    <div className="hidden lg:flex flex-col items-end">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic opacity-60">{new Date(tx.created_at).toLocaleDateString()}</span>
                                        <span className="text-[10px] font-black text-slate-300 tabular-nums uppercase">Ref: {tx.external_reference || tx.id.slice(0, 8)}</span>
                                    </div>

                                    <div className="flex flex-col items-end">
                                        <span className={`text-2xl font-black tabular-nums ${tx.type === 'IN' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                                            {tx.type === 'IN' ? '+' : '-'} {isHidden ? '•••• F' : formatCurrency(Math.abs(tx.amount))}
                                        </span>
                                        <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest mt-1 ${tx.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500/80' : 'bg-amber-500/10 text-amber-500'}`}>
                                            {tx.status}
                                        </div>
                                    </div>
                                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-300 group-hover/tx:bg-indigo-500 group-hover/tx:text-white transition-all">
                                        <ChevronRight size={18} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Pagination Placeholder */}
            {!loading && filteredTransactions.length > 0 && (
                <footer className="flex justify-center pt-8">
                    <div className="flex gap-2">
                        <button disabled className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-300">Précédent</button>
                        <button className="w-14 h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black">1</button>
                        <button className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl font-black hover:bg-slate-50">Suivant</button>
                    </div>
                </footer>
            )}

            <TransactionDetailModal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                transaction={selectedTx}
            />
        </div>
    );
}
