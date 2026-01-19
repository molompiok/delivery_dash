import React, { useState } from 'react';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { driverService } from '../../../api/drivers';

export default function Page() {
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await driverService.inviteDriver(phone);
            const relation = response.data.invitation;
            setSuccess(`Invitation envoyée ! Redirection...`);

            // Step 2: Redirect to detail page
            setTimeout(() => {
                window.location.href = `/drivers/${relation.driverId}`;
            }, 1000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de l\'invitation');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto">
            <div className="mb-6">
                <a href="/drivers" className="text-gray-500 hover:text-gray-700 flex items-center mb-2">
                    <ArrowLeft size={16} className="mr-1" /> Retour liste
                </a>
                <h1 className="text-2xl font-bold text-gray-800">Inviter un chauffeur</h1>
                <p className="text-gray-500">Envoyez une invitation par SMS.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-lg text-sm border border-green-100">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+225 07..."
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : (
                            <>
                                <Send size={18} className="mr-2" /> Envoyer
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
