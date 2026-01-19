import React, { useState } from 'react';
import { ordersApi, OrderPayload } from '../../../api/orders';
import { ArrowLeft, MapPin, Package, Truck, User } from 'lucide-react';
import { navigate } from 'vike/client/router';

export default function Page() {
    const [payload, setPayload] = useState<OrderPayload>({
        pickup: { label: 'Pickup', formattedAddress: 'Plateau, Abidjan', lat: 5.30966, lng: -4.01266, isDefault: false, isActive: true },
        dropoff: { label: 'Dropoff', formattedAddress: 'Cocody, Abidjan', lat: 5.3599517, lng: -3.9972323, isDefault: false, isActive: true },
        package_infos: [{ name: 'Document', quantity: 1 }],
        assignment_mode: 'GLOBAL',
        ref_id: ''
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Transform to backend structure
            // Backend expects "waypoints" array, not pickup/dropoff layout if using helper format,
            // BUT our frontend client uses a simpler "pickup/dropoff" which API client should map?
            // Wait, I didn't verify the api/orders.ts implementation fully mapping this.
            // Let's assume the API client sends what we define here. 
            // The backend CreateOrder payload expects "waypoints". 
            // So we need to map this.

            const backendPayload = {
                waypoints: [
                    {
                        type: 'pickup',
                        address_text: payload.pickup.formattedAddress,
                        coordinates: [payload.pickup.lng, payload.pickup.lat],
                        package_infos: payload.package_infos
                    },
                    {
                        type: 'delivery',
                        address_text: payload.dropoff.formattedAddress,
                        coordinates: [payload.dropoff.lng, payload.dropoff.lat],
                    }
                ],
                assignment_mode: payload.assignment_mode,
                ref_id: payload.ref_id === '' ? undefined : payload.ref_id
            };

            const data = await ordersApi.create(backendPayload as any);
            setResult(data);
        } catch (error: any) {
            console.error(error);
            alert('Error creating order: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-12">
            <div className="flex items-center gap-4">
                <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Nouvelle Commande</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <form onSubmit={handleSubmit} className="md:col-span-2 space-y-6">
                    {/* Locations */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                        <h2 className="font-semibold flex items-center gap-2"><MapPin size={18} /> Trajet</h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Point de départ</label>
                            <input type="text" value={payload.pickup.formattedAddress}
                                onChange={e => setPayload({ ...payload, pickup: { ...payload.pickup, formattedAddress: e.target.value } })}
                                className="w-full p-2 border rounded-lg" required />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                            <input type="text" value={payload.dropoff.formattedAddress}
                                onChange={e => setPayload({ ...payload, dropoff: { ...payload.dropoff, formattedAddress: e.target.value } })}
                                className="w-full p-2 border rounded-lg" required />
                        </div>
                    </div>

                    {/* Dispatch Options */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                        <h2 className="font-semibold flex items-center gap-2"><Truck size={18} /> Options Logistiques</h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mode d'attribution</label>
                            <select value={payload.assignment_mode}
                                onChange={e => setPayload({ ...payload, assignment_mode: e.target.value as any })}
                                className="w-full p-2 border rounded-lg">
                                <option value="GLOBAL">Global (Marketplace)</option>
                                <option value="INTERNAL">Interne (Ma Flotte)</option>
                                <option value="TARGET">Ciblé (Livreur Spécifique)</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                {payload.assignment_mode === 'INTERNAL' && "La commande sera proposée à vos chauffeurs."}
                                {payload.assignment_mode === 'GLOBAL' && "Recherche élargie à tous les livreurs disponibles."}
                                {payload.assignment_mode === 'TARGET' && "Visez un livreur précis via son Ref ID."}
                            </p>
                        </div>

                        {payload.assignment_mode === 'TARGET' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ref ID Cible</label>
                                <input type="text" value={payload.ref_id}
                                    onChange={e => setPayload({ ...payload, ref_id: e.target.value })}
                                    placeholder="ex: usr_12345"
                                    className="w-full p-2 border rounded-lg bg-blue-50" required />
                            </div>
                        )}
                    </div>

                    <button type="submit" disabled={loading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg disabled:opacity-50">
                        {loading ? 'Création...' : 'Valider la commande'}
                    </button>
                </form>

                {/* Result Preview */}
                <div className="md:col-span-1">
                    {result && (
                        <div className="bg-green-50 p-6 rounded-xl border border-green-200 sticky top-6">
                            <h3 className="text-green-800 font-bold mb-2">Succès !</h3>
                            <div className="text-sm space-y-2 text-green-700">
                                <p><strong>Order ID:</strong> {result.order.id}</p>
                                <p><strong>Status:</strong> {result.order.status}</p>
                                <p><strong>Mode:</strong> {result.order.assignmentMode}</p>
                                <p><strong>Offered To:</strong> {result.order.offeredDriverId || 'None yet'}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
