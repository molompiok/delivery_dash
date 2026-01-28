import React, { useEffect, useState } from 'react';
import { Truck, Users, Calendar, FileText, ShoppingBag, Map as MapIcon, DollarSign, Navigation, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { fleetService } from '../../api/fleet';
import { driverService } from '../../api/drivers';
import { companyService } from '../../api/company';
import { mockService, Order, Zone, PricingRule } from '../../api/mock';
import { User, Vehicle, Address } from '../../api/types';

export default function Page() {
  const [stats, setStats] = useState({
    vehicles: 0,
    drivers: 0,
    schedules: 0,
    documents: 0,
    orders: 0,
    zones: 0,
    activePricing: 'Aucun'
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const userStr = localStorage.getItem('delivery_user');
      if (!userStr) return;
      const user: User = JSON.parse(userStr);

      if (!user.companyId) return;

      // Parallel fetching
      const [
        vehiclesRes,
        driversRes,
        addressesRes,
        ordersData,
        zonesData,
        pricingData
      ] = await Promise.all([
        fleetService.listVehicles(user.companyId),
        driverService.listDrivers(),
        companyService.getAddresses(user.companyId),
        mockService.getOrders(),
        mockService.getZones(),
        mockService.getPricingRules()
      ]);

      const activePrice = pricingData.find((p: PricingRule) => p.active)?.name || 'Standard';

      setStats({
        vehicles: vehiclesRes.data.length,
        drivers: driversRes.data.length,
        schedules: 2, // Mocked for now until schedule service integration
        documents: 5, // Mocked count
        orders: ordersData.length,
        zones: zonesData.length,
        activePricing: activePrice
      });

      setRecentOrders(ordersData.slice(0, 3));

    } catch (error) {
      console.error("Dashboard load error", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin text-emerald-600" size={48} /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Vue d'ensemble</h1>
        <p className="text-gray-500">Bienvenue sur votre tableau de bord de gestion.</p>
      </div>

      {/* Grid 4 columns for large screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* 1. Vehicles */}
        <DashboardCard
          title="Véhicules"
          value={stats.vehicles}
          icon={<Truck className="text-blue-600" />}
          color="bg-blue-50"
          link="/fleet"
          desc="Véhicules actifs"
        />

        {/* 2. Drivers */}
        <DashboardCard
          title="Chauffeurs"
          value={stats.drivers}
          icon={<Users className="text-emerald-600" />}
          color="bg-emerald-50"
          link="/drivers"
          desc="En service"
        />

        {/* 3. Orders (Mock) */}
        <DashboardCard
          title="Commandes"
          value={stats.orders}
          icon={<ShoppingBag className="text-purple-600" />}
          color="bg-purple-50"
          link="/orders"
          desc="Commandes du jour"
        />

        {/* 4. Map (Mock) */}
        <a href="/map" className="block group">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all h-full flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-slate-100 opacity-50 group-hover:scale-105 transition-transform bg-[url('https://raw.githubusercontent.com/Sublymus/sublymus/main/map-bg.png')] bg-cover bg-center"></div>
            <div className="relative z-10 bg-white/90 p-4 rounded-full shadow-sm mb-2">
              <MapIcon className="text-indigo-600" size={24} />
            </div>
            <h3 className="relative z-10 font-semibold text-gray-800">Carte Live</h3>
            <p className="relative z-10 text-xs text-gray-500 mt-1">Suivi temps réel</p>
          </div>
        </a>

        {/* 5. Schedules */}
        <DashboardCard
          title="Horaires"
          value={stats.schedules} // Placeholder
          icon={<Calendar className="text-orange-600" />}
          color="bg-orange-50"
          link="/schedules"
          desc="Plages actives"
        />

        {/* 6. Pricing (Mock) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-rose-50 rounded-lg">
              <DollarSign className="text-rose-600" size={24} />
            </div>
            <a href="/pricing" className="text-gray-400 hover:text-emerald-600"><ArrowRight size={20} /></a>
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Pricing Actif</p>
            <h3 className="text-xl font-bold text-gray-900 mt-1 truncate" title={stats.activePricing}>{stats.activePricing}</h3>
          </div>
        </div>

        {/* 7. Zones (Mock) */}
        <DashboardCard
          title="Zones"
          value={stats.zones}
          icon={<Navigation className="text-cyan-600" />}
          color="bg-cyan-50"
          link="/zones"
          desc="Zones couvertes"
        />

        {/* 8. Documents */}
        <DashboardCard
          title="Documents"
          value={stats.documents} // Placeholder
          icon={<FileText className="text-slate-600" />}
          color="bg-slate-50"
          link="/documents"
          desc="Fichiers entreprise"
        />

      </div>

      {/* Quick Preview Section - Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800">Commandes Récentes</h2>
            <a href="/orders" className="text-sm text-emerald-600 hover:underline">Voir tout</a>
          </div>
          <div className="space-y-4">
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    {order.customerName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{order.customerName}</div>
                    <div className="text-xs text-gray-500">{order.pickupAddress?.formattedAddress}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-medium">{(order.pricingData?.finalPrice || 0).toLocaleString()} FCFA</div>
                  <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                    order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions or Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Alertes</h2>
          <div className="space-y-4">
            <div className="flex gap-3 items-start p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Document Expiré</span>
                Assurance Moto-01 expirée hier.
              </div>
            </div>
            <div className="flex gap-3 items-start p-3 bg-amber-50 text-amber-700 rounded-lg text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Maintenance</span>
                Camion C-03 nécessite une révision.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ title, value, icon, color, link, desc }: any) {
  return (
    <a href={link} className="block group">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow h-full flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-lg ${color} group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          <div className="text-gray-400 group-hover:text-emerald-600 transition-colors">
            <ArrowRight size={20} />
          </div>
        </div>
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-1">{value}</h3>
          <p className="text-xs text-gray-400 mt-1">{desc}</p>
        </div>
      </div>
    </a>
  );
}
