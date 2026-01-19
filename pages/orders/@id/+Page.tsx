import React, { useEffect, useState } from 'react';
import { usePageContext } from 'vike-react/usePageContext';
import { RefreshCw, MapPin, Package, Clock, User, ArrowLeft, AlertCircle } from 'lucide-react';
import { ordersApi, Order } from '../../../api/orders';
import { socketClient } from '../../../api/socket';

export default function Page() {
    const pageContext = usePageContext();
    const { id } = pageContext.routeParams;
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            loadOrder(id);

            // Connect socket for real-time updates on this specific order
            const socket = socketClient.connect();

            // Listen for status updates
            socket.on('status_updated', (payload: any) => {
                if (payload && payload.orderId === id) {
                    // Optimistic update or reload
                    setOrder(prev => prev ? { ...prev, status: payload.status } : null);
                    // Ideally we verify if payload has more data or reload full object
                    loadOrder(id);
                }
            });

            // Listen for driver assignment
            socket.on('mission:offered', (payload: any) => {
                if (payload && payload.orderId === id) {
                    loadOrder(id);
                }
            });

            return () => {
                // We don't necessarily disconnect as other pages might use it, 
                // but we should remove listeners if we added specific ones manually or rely on hooks.
                // Since we use a singleton, removing specific listeners is harder without named functions.
                // For now, we leave it as is or rely on a wrapper. 
                socket.off('status_updated');
                socket.off('mission:offered');
            };
        }
    }, [id]);

    const loadOrder = async (orderId: string) => {
        setLoading(true);
        try {
            const data = await ordersApi.get(orderId);
            setOrder(data);
            setError(null);
        } catch (e: any) {
            console.error(e);
            setError('Impossible de charger la commande. Elle n\'existe peut-être pas.');
        }
        setLoading(false);
    };

    if (loading) return <div className="p-8 text-center">Chargement des détails...</div>;
    if (error) return <div className="p-8 text-center text-red-600 flex flex-col items-center gap-2"><AlertCircle /> {error}</div>;
    if (!order) return <div className="p-8 text-center">Commande introuvable.</div>;

    const steps = [
        { status: 'PENDING', label: 'En attente', date: order.createdAt },
        { status: 'ASSIGNED', label: 'Assignée', active: ['ASSIGNED', 'AT_PICKUP', 'COLLECTED', 'AT_DELIVERY', 'DELIVERED'].includes(order.status) },
        { status: 'AT_PICKUP', label: 'Au retrait', active: ['AT_PICKUP', 'COLLECTED', 'AT_DELIVERY', 'DELIVERED'].includes(order.status) },
        { status: 'COLLECTED', label: 'Récupérée', active: ['COLLECTED', 'AT_DELIVERY', 'DELIVERED'].includes(order.status) },
        { status: 'AT_DELIVERY', label: 'Livraison', active: ['AT_DELIVERY', 'DELIVERED'].includes(order.status) },
        { status: 'DELIVERED', label: 'Livrée', active: ['DELIVERED'].includes(order.status) },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <a href="/orders" className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                    <ArrowLeft size={24} />
                </a>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Commande #{order.id.substring(0, 8)}</h1>
                    <div className="text-sm text-gray-500">Créée le {new Date(order.createdAt).toLocaleString()}</div>
                </div>
                <div className="ml-auto">
                    <span className={`px-4 py-2 rounded-full font-bold text-sm ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                        order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                        }`}>
                        {order.status}
                    </span>
                </div>
            </div>

            {/* Timeline */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-6">Chronologie</h3>
                <div className="flex justify-between items-center relative">
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-100 -z-0"></div>
                    {steps.map((step, idx) => (
                        <div key={step.status} className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
                            <div className={`w-4 h-4 rounded-full border-2 ${step.active || step.status === order.status || (idx === 0) ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
                                }`}></div>
                            <span className={`text-xs font-medium ${step.active || step.status === order.status ? 'text-gray-900' : 'text-gray-400'
                                }`}>{step.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Locations */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                        <MapPin size={18} /> Itinéraire
                    </h3>

                    <div className="space-y-4">
                        <div className="relative pl-8 border-l-2 border-gray-100 pb-6">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500"></div>
                            <div className="text-xs text-gray-500 uppercase font-bold mb-1">Point de retrait</div>
                            <div className="text-gray-900 font-medium">{order.pickupAddress?.formattedAddress}</div>
                            {/* <div className="text-sm text-gray-500">{order.pickupAddress.contactName}</div> */}
                        </div>

                        <div className="relative pl-8 border-l-2 border-transparent">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-green-100 border-2 border-green-500"></div>
                            <div className="text-xs text-gray-500 uppercase font-bold mb-1">Destination</div>
                            <div className="text-gray-900 font-medium">{order.deliveryAddress?.formattedAddress}</div>
                        </div>
                    </div>
                </div>

                {/* Driver Info */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                        <User size={18} /> Chauffeur & Véhicule
                    </h3>

                    {order.driverId ? (
                        <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                                <User size={24} />
                            </div>
                            <div>
                                <div className="font-bold text-gray-900">ID: {order.driverId}</div>
                                <div className="text-sm text-gray-500">Assigné</div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 text-amber-700 text-sm flex items-center gap-3">
                            <Clock size={18} />
                            Recherche de chauffeur en cours...
                        </div>
                    )}

                    <div className="border-t border-gray-100 pt-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">Mode d'attribution</span>
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{order.assignmentMode}</span>
                        </div>
                        {order.refId && (
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Ref ID</span>
                                <span className="font-mono text-sm text-gray-500">{order.refId}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pricing */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4 md:col-span-2">
                    <h3 className="font-medium text-gray-900">Détail du Prix</h3>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Distance estimée</span>
                        <span className="font-medium">{(order.pricingData?.distance / 1000).toFixed(1)} km</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Tarif de base</span>
                        <span className="font-medium">{order.pricingData?.details?.baseFare} FCFA</span>
                    </div>
                    <div className="flex justify-between items-center py-2 text-lg font-bold">
                        <span>Total</span>
                        <span>{order.pricingData?.finalPrice?.toLocaleString()} FCFA</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
