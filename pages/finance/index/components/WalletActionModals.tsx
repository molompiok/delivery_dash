import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownLeft, Send, Plus, CreditCard, Wallet, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { walletService, PayoutEstimate } from '../../../../api/wallet';

const openCenteredPopup = (url: string, title: string, w: number, h: number) => {
    const y = window.top!.outerHeight / 2 + window.top!.screenY - (h / 2);
    const x = window.top!.outerWidth / 2 + window.top!.screenX - (w / 2);
    return window.open(url, title, `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=no, width=${w}, height=${h}, top=${y}, left=${x}`);
};

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    walletId: string;
    currentBalance?: number;
    onSuccess: () => void;
}

interface TransferModalProps extends ModalProps {
    wallets: any[]; // Using any[] to avoid circular issues or just simple array
}

export const RechargeModal: React.FC<ModalProps> = ({ isOpen, onClose, walletId, onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setAmount('');
            setCheckoutUrl(null);
        }
    }, [isOpen]);

    const handleRecharge = async () => {
        if (!amount || isNaN(Number(amount))) return;
        if (!walletId) {
            alert('Erreur: Aucun portefeuille sélectionné');
            return;
        }
        setLoading(true);
        try {
            const res = await walletService.deposit({
                walletId,
                amount: Number(amount),
                description: `Rechargement ETP Hub`
            });

            const url = res.checkout_url || res.checkoutUrl || res.data?.waveCheckoutUrl;

            if (url) {
                setCheckoutUrl(url);
                const popup = openCenteredPopup(url, 'Wave Checkout', 600, 800);
                if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                    // Popup blocked, we'll show a link in the UI
                    console.warn('Popup blocked');
                } else {
                    onClose();
                    const popupWatcher = window.setInterval(() => {
                        if (!popup.closed) return;
                        window.clearInterval(popupWatcher);
                        onSuccess();
                    }, 1000);
                }
            } else {
                throw new Error('No checkout URL received');
            }
        } catch (e) {
            console.error('Recharge failed', e);
            alert('Erreur lors de l\'initiation du paiement');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

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
                    className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-6 md:p-8 shadow-2xl overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 md:p-6">
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex flex-col items-center text-center space-y-4 pt-4">
                        <div className="w-20 h-20 bg-indigo-500/10 rounded-[2rem] flex items-center justify-center text-indigo-500">
                            <Plus size={40} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Recharger</h3>
                            <p className="text-slate-500 text-sm">Ajoutez des fonds via Wave Checkout</p>
                        </div>
                    </div>

                    <div className="mt-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Montant (F CFA)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 md:p-5 text-2xl font-black tabular-nums focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                placeholder="0"
                            />
                        </div>

                        <div className="bg-indigo-50 dark:bg-indigo-500/5 p-4 rounded-2xl flex gap-3 text-indigo-600 dark:text-indigo-400">
                            <AlertCircle size={20} className="shrink-0" />
                            <p className="text-xs font-bold leading-relaxed">
                                Vous allez être redirigé vers la passerelle sécurisée Wave pour finaliser le paiement.
                            </p>
                        </div>

                        <button
                            disabled={(!amount && !checkoutUrl) || loading}
                            onClick={handleRecharge}
                            className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 ${(!amount && !checkoutUrl) || loading ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02] active:scale-95'}`}
                        >
                            {loading ? 'Redirection...' : checkoutUrl ? 'Ouvrir le paiement' : 'Payer avec Wave'}
                        </button>

                        {checkoutUrl && (
                            <p className="text-center text-[10px] font-bold text-slate-400">
                                Si la fenêtre ne s'est pas ouverte, <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">cliquez ici</a>
                            </p>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export const WithdrawModal: React.FC<ModalProps> = ({ isOpen, onClose, walletId, currentBalance, onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [estimate, setEstimate] = useState<PayoutEstimate | null>(null);
    const [estimateLoading, setEstimateLoading] = useState(false);
    const [estimateError, setEstimateError] = useState<string | null>(null);

    const amountNum = Number(amount);
    const hasValidAmount = Number.isFinite(amountNum) && amountNum > 0;
    const formatNumber = (value: number) => new Intl.NumberFormat('fr-FR').format(value);

    useEffect(() => {
        if (!isOpen) {
            setAmount('');
            setPhone('');
            setEstimate(null);
            setEstimateError(null);
            setEstimateLoading(false);
            return;
        }

        if (!hasValidAmount || !walletId) {
            setEstimate(null);
            setEstimateError(null);
            setEstimateLoading(false);
            return;
        }

        let cancelled = false;
        const timeoutId = window.setTimeout(async () => {
            setEstimateLoading(true);
            setEstimateError(null);
            try {
                const data = await walletService.estimatePayout({
                    walletId,
                    amount: amountNum,
                });
                if (!cancelled) setEstimate(data);
            } catch (e: any) {
                if (!cancelled) {
                    setEstimateError(e?.message || 'Impossible d’estimer les frais');
                }
            } finally {
                if (!cancelled) setEstimateLoading(false);
            }
        }, 250);

        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [amountNum, hasValidAmount, isOpen, walletId]);

    const fallbackEstimate: PayoutEstimate | null = hasValidAmount
        ? {
            net_amount: Math.floor(amountNum),
            fee_bps: 100,
            estimated_fee: Math.ceil((Math.floor(amountNum) * 100) / 10000),
            total_debit: Math.floor(amountNum) + Math.ceil((Math.floor(amountNum) * 100) / 10000),
        }
        : null;

    const effectiveEstimate = estimate || fallbackEstimate;
    const effectiveBalance = typeof estimate?.balance_available === 'number'
        ? estimate.balance_available
        : (typeof currentBalance === 'number' ? currentBalance : undefined);
    const hasBalanceCheck = effectiveEstimate && typeof effectiveBalance === 'number';
    const canPayout = estimate?.can_payout ?? (hasBalanceCheck ? effectiveEstimate!.total_debit <= (effectiveBalance || 0) : true);
    const missingAmount = hasBalanceCheck
        ? Math.max(0, effectiveEstimate!.total_debit - (effectiveBalance || 0))
        : (estimate?.missing_amount || 0);

    const handleWithdraw = async () => {
        if (!amount || !phone || !effectiveEstimate) return;

        if (hasBalanceCheck && !canPayout) {
            alert(`Solde insuffisant. Il manque ${formatNumber(missingAmount)} F CFA`);
            return;
        }

        setLoading(true);
        try {
            await walletService.payout({
                walletId,
                amount: Number(amount),
                recipient_phone: phone
            });
            onSuccess();
            onClose();
        } catch (e) {
            console.error('Withdrawal failed', e);
            alert('Erreur lors du retrait');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-6 md:p-8 shadow-2xl">
                    <div className="absolute top-0 right-0 p-4 md:p-6">
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
                    </div>
                    <div className="flex flex-col items-center text-center space-y-4 pt-4">
                        <div className="w-20 h-20 bg-orange-500/10 rounded-[2rem] flex items-center justify-center text-orange-500">
                            <ArrowUpRight size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Effectuer un Retrait</h3>
                    </div>
                    <div className="mt-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Montant</label>
                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-5 text-2xl font-black tabular-nums focus:ring-4 focus:ring-orange-500/10 transition-all" placeholder="0" />
                        </div>
                        {effectiveEstimate && (
                            <div className={`p-4 rounded-2xl border ${canPayout ? 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'}`}>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Estimation des frais</p>
                                <div className="space-y-1 text-sm font-bold text-slate-700 dark:text-slate-200">
                                    <p>Net demandé: {formatNumber(effectiveEstimate.net_amount)} F</p>
                                    <p>Frais estimés ({(effectiveEstimate.fee_bps / 100).toFixed(2)}%): {formatNumber(effectiveEstimate.estimated_fee)} F</p>
                                    <p className="font-black">Total débité wallet: {formatNumber(effectiveEstimate.total_debit)} F</p>
                                    {typeof effectiveBalance === 'number' && (
                                        <p>Solde disponible: {formatNumber(effectiveBalance)} F</p>
                                    )}
                                    {!canPayout && hasBalanceCheck && (
                                        <p className="text-rose-600 dark:text-rose-400 font-black">
                                            Solde insuffisant, manque: {formatNumber(missingAmount)} F
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                        {estimateLoading && (
                            <p className="text-xs text-slate-500 px-1">Calcul des frais...</p>
                        )}
                        {estimateError && (
                            <p className="text-xs text-rose-500 px-1">{estimateError}</p>
                        )}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Numéro Wave du bénéficiaire</label>
                            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 md:p-5 text-lg font-black tracking-widest focus:ring-4 focus:ring-orange-500/10 transition-all" placeholder="00 00 00 00 00" />
                        </div>
                        <button disabled={!amount || !phone || loading || !canPayout} onClick={handleWithdraw} className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest transition-all shadow-xl shadow-orange-500/20 ${!amount || !phone || loading || !canPayout ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02] active:scale-95'}`}>
                            {loading ? 'Traitement...' : 'Confirmer le Retrait'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose, walletId, onSuccess, wallets }) => {
    const [amount, setAmount] = useState('');
    const [targetWalletId, setTargetWalletId] = useState('');
    const [loading, setLoading] = useState(false);
    const [targets, setTargets] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            walletService.listTransferTargets().then(setTargets).catch(console.error);
        }
    }, [isOpen]);

    const sourceWallet = wallets.find(w => w.id === walletId);

    // Combine internal wallets (Personal) and third-party targets (Drivers/Managers)
    const internalWallets = wallets.filter(w => w.id !== walletId);
    const allTargets = [
        ...internalWallets.map(w => ({ ...w, label: w.label || (w.walletType === 'PERSONAL' ? 'Mon Portefeuille Personnel' : 'Business'), category: 'INTERNE' })),
        ...targets.map(t => ({ ...t, category: t.type === 'DRIVER' ? 'LIVREUR' : 'COLLECTIVE' }))
    ];

    const handleTransfer = async () => {
        if (!amount || !targetWalletId) return;

        const amountNum = Number(amount);
        if (sourceWallet && amountNum > sourceWallet.balanceAvailable) {
            alert('Solde insuffisant sur le portefeuille source');
            return;
        }

        setLoading(true);
        try {
            const target = allTargets.find(t => t.id === targetWalletId);
            await walletService.transfer({
                from_wallet_id: walletId,
                to_wallet_id: targetWalletId,
                amount: amountNum,
                label: `Transfert interne vers ${target?.label || 'portefeuille'}`
            });
            onSuccess();
            onClose();
        } catch (e) {
            console.error('Transfer failed', e);
            alert('Erreur lors du transfert');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-6 md:p-8 shadow-2xl">
                    <div className="absolute top-0 right-0 p-4 md:p-6">
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
                    </div>
                    <div className="flex flex-col items-center text-center space-y-4 pt-4">
                        <div className="w-20 h-20 bg-blue-500/10 rounded-[2rem] flex items-center justify-center text-blue-500">
                            <Send size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Transférer</h3>
                    </div>
                    <div className="mt-8 space-y-6">
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col gap-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Source</span>
                                        <span className="font-bold text-sm truncate max-w-[120px]">{sourceWallet?.label || 'Managed Company'}</span>
                                        <span className="text-[10px] text-emerald-500 font-bold tabular-nums">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(sourceWallet?.balanceAvailable || 0).replace('XOF', 'F')} dispo.</span>
                                    </div>
                                    <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
                                        <ArrowUpRight size={20} />
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Destination</span>
                                        <select
                                            value={targetWalletId}
                                            onChange={(e) => setTargetWalletId(e.target.value)}
                                            className="bg-transparent border-none p-0 font-bold text-sm text-right focus:ring-0 max-w-[150px] cursor-pointer outline-none"
                                        >
                                            <option value="">Sélectionner</option>
                                            <optgroup label="Mes Comptes" className="text-slate-400 font-bold uppercase text-[10px]">
                                                {allTargets.filter(t => t.category === 'INTERNE').map(t => (
                                                    <option key={`int-${t.id}`} value={t.id}>{t.label}</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Livreurs" className="text-slate-400 font-bold uppercase text-[10px]">
                                                {allTargets.filter(t => t.type === 'DRIVER').map(t => (
                                                    <option key={`drv-${t.id}`} value={t.id}>{t.label}</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Collaborateurs" className="text-slate-400 font-bold uppercase text-[10px]">
                                                {allTargets.filter(t => t.type === 'MANAGER').map(t => (
                                                    <option key={`mng-${t.id}`} value={t.id}>{t.label}</option>
                                                ))}
                                            </optgroup>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Montant à transférer</label>
                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 md:p-5 text-2xl font-black tabular-nums focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="0" />
                        </div>
                        <button
                            disabled={!amount || !targetWalletId || loading || (sourceWallet && Number(amount) > sourceWallet.balanceAvailable)}
                            onClick={handleTransfer}
                            className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 ${!amount || !targetWalletId || loading || (sourceWallet && Number(amount) > sourceWallet.balanceAvailable) ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.02] active:scale-95'}`}
                        >
                            {loading ? 'Transfert en cours...' : (sourceWallet && Number(amount) > sourceWallet.balanceAvailable) ? 'Solde insuffisant' : 'Confirmer le Transfert'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
