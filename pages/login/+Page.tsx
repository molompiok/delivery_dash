import React, { useState } from 'react';
import { Truck, ArrowRight, Loader2 } from 'lucide-react';
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
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600">
                        <Truck size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Sublymus Delivery</h1>
                    <p className="text-gray-500 mt-2 text-center">
                        {step === 'PHONE' ? 'Connectez-vous pour gérer votre flotte' : 'Vérification du numéro'}
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
                        {error}
                    </div>
                )}

                {step === 'PHONE' ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+225 07..."
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : (
                                <>
                                    Recevoir le code <ArrowRight size={18} className="ml-2" />
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Code de vérification</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="123456"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-center tracking-widest text-lg"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Connexion'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep('PHONE')}
                            className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
                        >
                            Retour
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
