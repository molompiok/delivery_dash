import React, { useState } from 'react';
import { Truck, ArrowRight, Loader2, Phone, ShieldCheck, ChevronLeft } from 'lucide-react';
import { authService } from '../../api/auth';

export default function Page() {
    const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await authService.sendOtp(phone);
            setStep('OTP');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de l\'envoi du code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await authService.login(phone, otp);
            window.location.href = '/';
        } catch (err: any) {
            setError(err.response?.data?.message || 'Code invalide');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>

            <div className="w-full max-w-md z-10 animate-in fade-in zoom-in duration-500">
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-[0_32px_64px_rgba(0,0,0,0.08)] dark:shadow-[0_32px_64px_rgba(0,0,0,0.2)] p-10 relative overflow-hidden">

                    {/* Header */}
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-[2rem] flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400 shadow-sm relative group">
                            <Truck size={36} className="group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-4 border-white dark:border-slate-900"></div>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Sublymus</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium text-center max-w-[250px]">
                            {step === 'PHONE'
                                ? 'La logistique de demain commence ici.'
                                : 'Saisissez le code envoyé par SMS.'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-2xl text-center animate-in slide-in-from-top-2 duration-300">
                            {error}
                        </div>
                    )}

                    {step === 'PHONE' ? (
                        <form onSubmit={handleSendOtp} className="space-y-6">
                            <div className="relative">
                                <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2 ml-1">Téléphone</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                        <Phone size={18} />
                                    </div>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+225 07 59 92 95 15"
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-900 dark:text-white font-semibold"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                                    <>
                                        Continuer <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="relative">
                                <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2 ml-1 text-center">Code de vérification</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="······"
                                        maxLength={6}
                                        className="w-full px-4 py-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-900 dark:text-white font-black text-center tracking-[0.5em] text-2xl"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                                    <>
                                        Vérifier <ShieldCheck size={20} />
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep('PHONE')}
                                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                <ChevronLeft size={16} /> Retour
                            </button>
                        </form>
                    )}

                    {/* Footer decoration */}
                    <div className="mt-10 pt-10 border-t border-slate-50 dark:border-slate-800 text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Powered by Sublymus Core</p>
                    </div>
                </div>

                <p className="mt-8 text-center text-slate-400 text-xs font-medium">
                    En vous connectant, vous acceptez nos <a href="#" className="text-slate-600 dark:text-slate-300 underline underline-offset-4">Conditions d'Utilisation</a>.
                </p>
            </div>
        </div>
    );
}
