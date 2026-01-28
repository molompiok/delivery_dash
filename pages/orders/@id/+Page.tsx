import React, { useEffect, useState } from 'react';
import { usePageContext } from 'vike-react/usePageContext';
import {
    ChevronLeft,
    Clock,
    MapPin,
    Package,
    Truck,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ArrowRight,
    Navigation,
    Info,
    DollarSign
} from 'lucide-react';
import { ordersApi, Order } from '../../../api/orders';

export default function Page() {
    const pageContext = usePageContext();
    const { id } = pageContext.routeParams;
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            fetchOrder();
        }
    }, [id]);

    const fetchOrder = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await ordersApi.get(id);
            setOrder(data);
        } catch (err: any) {
            console.error("Failed to fetch order:", err);
            setError(err.message || "Une erreur est survenue lors du chargement de la commande.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <Loader2 className="animate-spin text-indigo-600" size={48} />
                <p className="text-slate-500 font-medium animate-pulse">Chargement de la mission...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-12 text-center max-w-2xl mx-auto mt-12">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="text-rose-500" size={40} />
                </div>
                <h1 className="text-2xl font-black text-slate-900 mb-2">Oups ! Commande introuvable</h1>
                <p className="text-slate-500 mb-8">{error || "Nous n'avons pas pu récupérer les détails de cette commande. Le serveur est peut-être temporairement indisponible."}</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => window.location.href = '/orders'}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
                    >
                        <ChevronLeft size={20} />
                        Retour aux commandes
                    </button>
                    <button
                        onClick={fetchOrder}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'DELIVERED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'PENDING': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'FAILED': return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'CANCELLED': return 'bg-slate-50 text-slate-700 border-slate-200';
            default: return 'bg-indigo-50 text-indigo-700 border-indigo-200';
        }
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => window.location.href = '/orders'}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-lg transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                                {order.id.replace('ord_', '#')}
                            </h1>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(order.status)}`}>
                                {order.status}
                            </span>
                        </div>
                        <p className="text-slate-500 mt-1 flex items-center gap-2">
                            Réf Externe: <span className="font-mono font-bold text-slate-700">{order.refId || 'N/A'}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            Créée le {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {order.status === 'PENDING' && (
                        <button className="px-6 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold text-sm transition-all border border-rose-100">
                            Annuler la mission
                        </button>
                    )}
                    <button className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 transition-all">
                        Modifier
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Mission Details */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Progress Card (Mocked for now) */}
                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 opacity-50"></div>
                        <h2 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-2">
                            <Navigation className="text-indigo-600" size={20} />
                            Déroulement de la Mission
                        </h2>

                        <div className="space-y-12 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                            {/* Start Point */}
                            <div className="relative pl-10">
                                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-4 border-indigo-600 z-10"></div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-slate-900">Point de Départ</h3>
                                        <p className="text-sm text-slate-500 mt-1">{order.pickupAddress?.formattedAddress}</p>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                </div>
                            </div>

                            {/* Delivery Point */}
                            <div className="relative pl-10">
                                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-4 border-rose-500 z-10"></div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-slate-900">Destination Finale</h3>
                                        <p className="text-sm text-slate-500 mt-1">{order.deliveryAddress?.formattedAddress}</p>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">EDD: --:--</span>
                                </div>
                            </div>
                        </div>

                        {/* Order Type Info */}
                        <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm shrink-0">
                                <Info className="text-indigo-500" size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">Type de Commande</h4>
                                <p className="text-sm text-slate-500 mt-1">
                                    {order.isComplex
                                        ? "Cette mission fait partie d'un flux logistique complexe (Cas G) avec plusieurs étapes d'optimisation."
                                        : "Commande standard de type Point-à-Point."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Items/Packages */}
                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
                        <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                            <Package className="text-indigo-600" size={20} />
                            Articles & Colis
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Simulation of packages if missing */}
                            {(order.packages || []).length > 0 ? (order.packages || []).map((pkg: any) => (
                                <div key={pkg.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-200">
                                        <Package className="text-slate-400" size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800">{pkg.name}</div>
                                        <div className="text-xs text-slate-400">Poids: {pkg.weight || 'N/A'}g</div>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 rounded-2xl border-2 border-dashed border-slate-100 text-center col-span-2">
                                    <p className="text-slate-400 text-sm italic">Aucun article spécifié</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Driver & Financials */}
                <div className="space-y-8">
                    {/* Driver Assignation */}
                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
                        <h2 className="text-lg font-black text-slate-900 mb-6 font-black uppercase tracking-tight">Attribution</h2>

                        {order.driver ? (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-xl font-black text-indigo-600 border border-indigo-200">
                                        {order.driver.name?.charAt(0) || 'D'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 text-lg">{order.driver.name}</div>
                                        <div className="text-sm text-slate-500">{order.driver.phone}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-700 text-xs font-bold">
                                    <CheckCircle2 size={14} />
                                    Chauffeur en service
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 rounded-full border-4 border-dashed border-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-200">
                                    <Truck size={32} />
                                </div>
                                <h3 className="font-bold text-slate-800">En attente d'attribution</h3>
                                <p className="text-xs text-slate-400 mt-1 px-4 text-center">Recherche du meilleur chauffeur disponible via {order.assignmentMode}...</p>
                                <button className="mt-6 w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                                    Attribuer manuellement
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Financial Summary */}
                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 bg-gradient-to-br from-white to-slate-50">
                        <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                            <DollarSign className="text-indigo-600" size={20} />
                            Frais de Mission
                        </h2>

                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Distance Totale</span>
                                <span className="font-bold text-slate-800">{(order.totalDistanceMeters ? (order.totalDistanceMeters / 1000).toFixed(2) : '0')} km</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Durée Estimée</span>
                                <span className="font-bold text-slate-800">{(order.totalDurationSeconds ? (order.totalDurationSeconds / 60).toFixed(0) : '0')} min</span>
                            </div>
                            <div className="h-px bg-slate-200 my-4"></div>
                            <div className="flex justify-between items-center">
                                <span className="font-black text-slate-900 uppercase tracking-widest text-[10px]">Total Client</span>
                                <div className="text-2xl font-black text-indigo-600">
                                    {(order.pricingData?.finalPrice || 0).toLocaleString()} <span className="text-xs">FCFA</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
