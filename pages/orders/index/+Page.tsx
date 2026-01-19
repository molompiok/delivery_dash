import React, { useEffect, useState, useRef } from 'react';
import { ShoppingBag, Search, Filter, RefreshCw } from 'lucide-react';
import { ordersApi, Order } from '../../../api/orders';
import { socketClient } from '../../../api/socket';

export default function Page() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [realTimeEnabled, setRealTimeEnabled] = useState(false);
    const socketRef = useRef<any>(null);

    useEffect(() => {
        loadOrders();
        return () => {
            if (socketRef.current) {
                socketClient.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        if (realTimeEnabled) {
            const socket = socketClient.connect();
            socketRef.current = socket;

            // Listen for new missions (orders offered to drivers)
            // Ideally we should listen to a specific room, but for dash we might need a general admin room.
            // For now, let's assume we get updates if we are in the loop. 
            // Actually, `mission:offered` is usually for drivers.
            // Admin dash should probably listen to `order:created` or similar if implemented,
            // or just refresh on `mission:offered` if we can hear it.

            // To be safe and simple for this demo:
            // We will listen to `order:status_updated` which is emitted to `orders:{id}` room.
            // But we need to be in that room.
            // PASSIVE: We can't easily listen to ALL orders without a global admin room.
            // Let's assume the backend emits to a public/admin channel or we rely on polling/refresh for list.

            // Wait, the user asked for "real time see orders add".
            // If the backend doesn't emit a global "new order" event, we might struggle.
            // Let's check `orders_controller` or `socket_listener` to see what is emitted.

            // Re-reading `SocketListener`:
            // `WsService.emitToRoom(\`drivers:\${driverId}\`, 'mission:offered', ...)`
            // `WsService.emitToRoom(\`orders:\${orderId}\`, 'status_updated', ...)`

            // There is no global "all orders" room yet.
            // I should probably add one in the backend to support this feature properly,
            // OR I can just simulate "Real Time" by polling every 5 seconds if enabled.
            // The user asked for "socket.io". I should add the event to the backend.

            // Let's keep the frontend ready to receive `orders:new`.
            socket.on('orders:new', (newOrder: Order) => {
                setOrders(prev => [newOrder, ...prev]);
            });

        } else {
            if (socketRef.current) {
                socketClient.disconnect();
                socketRef.current = null;
            }
        }
    }, [realTimeEnabled]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const data = await ordersApi.list();
            setOrders(data);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const toggleRealTime = () => {
        setRealTimeEnabled(!realTimeEnabled);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Commandes</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex gap-4 justify-between items-center">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Rechercher une commande..." className="w-full pl-10 pr-4 py-2 border rounded-lg" />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={toggleRealTime}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${realTimeEnabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <RefreshCw size={18} className={realTimeEnabled ? 'animate-spin' : ''} />
                            {realTimeEnabled ? 'Temps réel Activé' : 'Activer Temps réel'}
                        </button>
                        <a href="/orders/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                            + Nouvelle Commande
                        </a>
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">Client</th>
                            <th className="p-4">Adresse Pickup</th>
                            <th className="p-4">Statut</th>
                            <th className="p-4 text-right">Montant</th>
                            <th className="p-4">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center">Chargement...</td></tr>
                        ) : orders.map(order => (
                            <tr key={order.id} className="hover:bg-gray-50">
                                <td className="p-4 font-mono text-sm text-gray-500">#{order.id.substring(0, 8)}...</td>
                                <td className="p-4 font-medium text-gray-900">Client</td>
                                <td className="p-4 text-gray-600 text-sm">{order.pickupAddress?.formattedAddress || 'N/A'}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                        order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right font-mono">{order.pricingData?.finalPrice?.toLocaleString() || 0} FCFA</td>
                                <td className="p-4">
                                    <a href={`/orders/${order.id}`} className="text-blue-600 hover:underline text-sm">Voir</a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
