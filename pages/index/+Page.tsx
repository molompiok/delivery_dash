import React, { useEffect, useState } from 'react';
import {
  Truck, Users, Calendar, FileText, ShoppingBag,
  Map as MapIcon, DollarSign, Navigation, ArrowRight,
  Loader2, AlertCircle, ChevronRight, Activity,
  ShieldCheck, Clock, Bell, MapPin, Package,
  Bike, ArrowDown, ArrowUp, CheckCircle2,
  Globe, Layers
} from 'lucide-react';
import { zoneService } from '../../api/zones';
import { ordersApi, OrderSummary } from '../../api/orders';
import { paymentsService } from '../../api/payments';
import { User, Vehicle, CompanyDriverSetting, Zone, PricingFilter } from '../../api/types';
import { useHeaderAutoHide } from '../../hooks/useHeaderAutoHide';
import { fleetService } from '../../api/fleet';
import { driverService } from '../../api/drivers';
import { MapLibre as GlobeMap } from '../../components/MapLibre';
import { formatId } from '../../api/utils';

export default function Page() {
  const [stats, setStats] = useState({
    vehiclesCount: 0,
    driversCount: 0,
    ordersCount: 0,
    zonesCount: 0,
    activePricingCount: 0,
    totalPricingCount: 0,
    activeTemplates: [] as string[]
  });
  const [data, setData] = useState<{
    vehicles: Vehicle[];
    drivers: CompanyDriverSetting[];
    orders: OrderSummary[];
    zones: Zone[];
  }>({
    vehicles: [],
    drivers: [],
    orders: [],
    zones: []
  });
  const [loading, setLoading] = useState(true);
  useHeaderAutoHide();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const userStr = localStorage.getItem('delivery_user');
      if (!userStr) return;
      const user: User = JSON.parse(userStr);
      if (!user.companyId) return;

      const [
        vehiclesRes,
        driversRes,
        ordersData,
        zonesData,
        pricingData
      ] = await Promise.all([
        fleetService.listVehicles(user.companyId),
        driverService.listDrivers(),
        ordersApi.list({ view: 'summary' }),
        zoneService.list({ ownerType: 'Company' }),
        paymentsService.getPricingFilters()
      ]);

      setStats({
        vehiclesCount: vehiclesRes.data.length,
        driversCount: driversRes.data.length,
        ordersCount: ordersData.meta?.total ?? ordersData.data?.length ?? 0,
        zonesCount: zonesData.length,
        activePricingCount: pricingData.filter((p: PricingFilter) => p.isActive).length,
        totalPricingCount: pricingData.length,
        activeTemplates: pricingData.filter((p: PricingFilter) => p.isActive).map((p: PricingFilter) => p.template).filter(Boolean) as string[]
      });

      setData({
        vehicles: vehiclesRes.data.slice(0, 5),
        drivers: driversRes.data.slice(0, 5),
        orders: (ordersData.data || []).slice(0, 5),
        zones: zonesData.slice(0, 4)
      });

    } catch (error) {
      console.error("Dashboard load error", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin text-emerald-500" size={40} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700 pb-40 px-4">
      {/* Header Section */}
      <header className="flex justify-between items-end px-1">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">Vue d'ensemble</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Gérez votre flotte et vos opérations en un coup d'œil.</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="hidden md:flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-2xl shadow-sm text-sm font-medium">
            <Activity size={16} className="text-emerald-500 animate-pulse" />
            <span className="text-slate-600 dark:text-slate-300">Système opérationnel</span>
          </div>

          <button className="relative p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all group border-amber-100 dark:border-amber-500/20" title="Centre de conformité - 2 alertes">
            <Bell size={20} className="text-amber-500 animate-swing" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-amber-500 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" />
          </button>
        </div>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 auto-rows-[140px] md:auto-rows-[160px] gap-4">


        {/* 4. Map Action - (4x2) */}
        <a href="/map" className="col-span-12 md:col-span-6 lg:col-span-4 row-span-2 group relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-xl">
          <div className="absolute inset-0 pointer-events-none">
            <GlobeMap
              center={{ lat: 5.33, lng: -3.98 }}
              zoom={1.5}
              projection="globe"
              rotateOnLowZoom={true}
              className="w-full h-full"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent"></div>
          <div className="absolute inset-x-6 bottom-6 flex justify-between items-end z-10">
            <div>
              <h3 className="text-white font-bold text-xl">Carte Temps Réel</h3>
              <p className="text-slate-400 text-sm mt-1">Suivez vos chauffeurs en live.</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:bg-emerald-500 group-hover:border-emerald-400 transition-all">
              <Navigation size={20} />
            </div>
          </div>
        </a>

        {/* 5. Zones - (4x2) */}
        <BentoCard
          className="col-span-12 md:col-span-6 lg:col-span-4 row-span-2"
          title="Zones de service"
          icon={<Navigation size={22} className="text-cyan-500" />}
          link="/map?tab=ZONES"
          linkColor="cyan"
          badge={`${stats.zonesCount} actives`}
        >
          <div className="mt-4 grid grid-cols-2 gap-2">
            {data.zones.map(z => (
              <a
                key={z.id}
                href={`/map?zone_id=${z.id}`}
                className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:shadow-sm transition-all group/zone"
              >
                <div className="w-8 h-8 rounded-full mb-2 border-2 border-white dark:border-slate-900 shadow-sm group-hover/zone:scale-110 transition-transform" style={{ backgroundColor: z.color }}></div>
                <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate w-full">{z.name}</div>
                <div className="text-[9px] text-slate-400 uppercase mt-0.5">{z.sector}</div>
              </a>
            ))}
          </div>
        </BentoCard>

        {/* 6. Info Blocks (Pricing, Schedules, Docs) - 4x2 total or separate */}
        <div className="col-span-12 md:col-span-12 lg:col-span-4 row-span-2 grid grid-cols-2 grid-rows-2 gap-4">
          {/* Pricing */}
          <a href="/finance" className="col-span-2 row-span-1 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl">
                <DollarSign size={20} className="text-rose-500" />
              </div>
              <div className="absolute flex items-end justify-start p-5 top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform">
                <ArrowRight className='dark:text-white/80' size={20} />
              </div>
            </div>
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest leading-none mb-2">Finance & Tarification</p>
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.activePricingCount} <span className="text-slate-300 dark:text-slate-600">/</span> {stats.totalPricingCount}
              </h3>
              <div className="flex gap-1.5">
                {stats.activeTemplates.map((tpl) => (
                  <div key={tpl} className="p-1.5 bg-rose-500/10 rounded-lg text-rose-500" title={tpl}>
                    {tpl === 'MISSION' && <Activity size={12} />}
                    {tpl === 'VOYAGE' && <Globe size={12} />}
                    {tpl === 'COMMANDE' && <Layers size={12} />}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">
              {stats.activeTemplates.length > 0 ? stats.activeTemplates.join(', ') : 'Aucun tarif actif'}
            </p>
          </a>

          {/* Schedules */}
          <a href="/schedules" className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow group">
            <div className="p-2 w-fit bg-amber-50 dark:bg-amber-500/10 rounded-xl mb-3">
              <Clock size={20} className="text-amber-500" />
            </div>
            <div className="absolute flex items-end justify-start p-5 top-0 right-0 w-24 h-24 bg-amber-50 dark:bg-amber-500/10 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform">
              <ArrowRight className='dark:text-white/80' size={20} />
            </div>
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest leading-none">Horaires</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Gérer</h3>
          </a>

          {/* Docs */}
          <a href="/documents" className=" relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow group">
            <div className="p-2 w-fit bg-slate-50 dark:bg-slate-500/10 rounded-xl mb-3">
              <FileText size={20} className="text-slate-500" />
            </div>
            <div className="absolute flex items-end justify-start p-5 top-0 right-0 w-24 h-24 bg-slate-50 dark:bg-slate-500/10 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform">
              <ArrowRight className='dark:text-white/80' size={20} />
            </div>
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest leading-none">Docs</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Fichiers</h3>
          </a>
        </div>

        {/* 1. Fleet Status - Wide & Tall (6x3) */}
        <BentoCard
          className="col-span-12 md:col-span-12 lg:col-span-7 row-span-2"
          title="Flotte de véhicules"
          icon={<Truck size={22} className="text-emerald-500" />}
          badge={stats.vehiclesCount > 0 ? `${stats.vehiclesCount} actifs` : 'Aucun'}
          link="/map?tab=VEHICLES"
          linkColor="emerald"
        >
          <div className="mt-4 space-y-2 pb-4">
            {data.vehicles.map(vhc => (
              <a
                key={vhc.id}
                href={`/map?vehicle_id=${vhc.id}`}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                    <Truck size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">{vhc.brand} {vhc.model}</div>
                    <div className="text-xs font-mono text-slate-500">{vhc.plate}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`w-2 h-2 rounded-full ${vhc.verificationStatus === 'APPROVED' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-400'}`} />
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>
              </a>
            ))}
            {data.vehicles.length === 0 && <p className="text-center text-slate-400 py-6 text-sm">Aucun véhicule enregistré</p>}
          </div>
        </BentoCard>

        {/* 2. Team - Smaller but rich (5x3) */}
        <BentoCard
          className="col-span-12 md:col-span-6 lg:col-span-5 row-span-2"
          title="Équipe"
          icon={<Users size={22} className="text-blue-500" />}
          link="/map?tab=DRIVERS"
          linkColor="blue"
          badge={
            <div className="flex items-center gap-3 ml-2">
              <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-100 dark:border-indigo-500/20">
                <Users size={12} className="text-indigo-500" />
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{stats.driversCount}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                <Activity size={12} className="text-emerald-500" />
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  {data.drivers.filter((d: any) => (d.driver as any)?.driverSetting?.status === 'ONLINE').length || 0}
                </span>
              </div>
            </div>
          }
        >
          <div className="mt-4 space-y-2">
            <div className="space-y-2">
              {data.drivers.map(cds => (
                <a
                  key={cds.id}
                  href={`/map?driver_id=${cds.id}`}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:scale-105 transition-transform">
                      {cds.driver?.fullName?.charAt(0) || 'D'}
                    </div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{cds.driver?.fullName}</div>
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${(cds.driver as any)?.driverSetting?.status === 'ONLINE' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'bg-slate-100 text-slate-500'}`}>
                    {(cds.driver as any)?.driverSetting?.status || 'OFFLINE'}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </BentoCard>

      </div>
      {/* 3. Orders - Timeline Cards */}
      <BentoCard
        className="col-span-12"
        title="Missions récentes"
        icon={<ShoppingBag size={22} className="text-purple-500" />}
        link="/orders"
        linkColor="purple"
        badge={`${stats.ordersCount} total`}
      >
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.orders.length > 0 ? data.orders.map((order: OrderSummary) => {
            const progress = order.itinerary?.progressPercent || 0;
            const visited = order.itinerary?.visitedCount || 0;
            const total = order.itinerary?.totalStops || 0;
            const isDelivered = order.status === 'DELIVERED';
            const isPending = order.status === 'PENDING';
            const isActive = !isDelivered && !isPending && progress > 0;

            return (
              <a
                key={order.id}
                href={`/orders/${order.id}`}
                className="group/card relative bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-400 cursor-pointer overflow-hidden flex flex-col"
              >
                {/* Accent glow for active orders */}
                {isActive && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 opacity-80" />}

                {/* Header: ID + Date + Driver */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-[12px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight group-hover/card:text-indigo-600 dark:group-hover/card:text-indigo-400 transition-colors">
                      {formatId(order.id)}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                      <Clock size={9} />
                      {new Date(order.timestamps.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} • {new Date(order.timestamps.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {order.attribution ? (
                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700/50 pl-1 pr-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-600/50">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-[8px] font-black text-white uppercase flex-shrink-0">
                        {order.attribution.driver.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate max-w-[60px]">{order.attribution.driver.name.split(' ')[0]}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 dark:bg-slate-700/30 rounded-full border border-dashed border-slate-200 dark:border-slate-600">
                      <Clock size={10} className="text-slate-400" />
                      <span className="text-[9px] font-bold text-slate-400">En attente</span>
                    </div>
                  )}
                </div>

                {/* === Mini Timeline === */}
                <div className="flex gap-3 flex-1">
                  {/* Vertical Timeline Line */}
                  <div className="flex flex-col items-center w-5 flex-shrink-0">
                    {/* Last stop dot */}
                    <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${order.itinerary?.stops?.last ? 'bg-emerald-500 border-emerald-300 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                      }`} />
                    {/* Connecting line segment 1 */}
                    <div className="w-0.5 flex-1 min-h-[8px] bg-gradient-to-b from-emerald-400 to-slate-200 dark:to-slate-700 rounded-full" />
                    {/* Motorcycle / Progress indicator */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' :
                      isDelivered ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                      }`}>
                      <Bike size={12} className={isActive || isDelivered ? 'text-white' : 'text-slate-400'} />
                    </div>
                    {/* Connecting line segment 2 */}
                    <div className="w-0.5 flex-1 min-h-[8px] bg-gradient-to-b from-slate-200 dark:from-slate-700 to-indigo-300 dark:to-indigo-600 rounded-full" />
                    {/* Next stop dot */}
                    <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${isActive ? 'bg-indigo-100 dark:bg-indigo-900 border-indigo-400 animate-pulse' :
                      isDelivered ? 'bg-emerald-500 border-emerald-300' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                      }`} />
                  </div>

                  {/* Stop Details */}
                  <div className="flex flex-col flex-1 min-w-0 justify-between gap-1">
                    {/* Last Stop */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                        {order.itinerary?.stops?.last?.address || order.itinerary?.display?.from || 'Départ'}
                      </span>
                      {order.itinerary?.stops?.last?.actions && (
                        <div className="flex items-center gap-2">
                          {order.itinerary.stops.last.actions.pickup > 0 && (
                            <span className="flex items-center gap-0.5 text-[9px] font-black text-amber-600"><ArrowDown size={9} className="stroke-[3]" />{order.itinerary.stops.last.actions.pickup}</span>
                          )}
                          {order.itinerary.stops.last.actions.drop > 0 && (
                            <span className="flex items-center gap-0.5 text-[9px] font-black text-emerald-600"><ArrowUp size={9} className="stroke-[3]" />{order.itinerary.stops.last.actions.drop}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Progress bar with percentage */}
                    <div className="flex items-center gap-2 py-1">
                      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${isDelivered ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-cyan-400 shadow-[0_0_8px_rgba(99,102,241,0.4)]'}`}
                          style={{ width: `${isDelivered ? 100 : progress}%` }}
                        />
                      </div>
                      <span className={`text-[9px] font-black whitespace-nowrap ${isDelivered ? 'text-emerald-500' : 'text-indigo-500'}`}>
                        {isDelivered ? '✓' : `${Math.round(progress)}%`}
                      </span>
                    </div>

                    {/* Next Stop */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-slate-900 dark:text-slate-100 truncate">
                        {order.itinerary?.stops?.next?.address || order.itinerary?.display?.to || 'Destination'}
                      </span>
                      {order.itinerary?.stops?.next?.actions && (
                        <div className="flex items-center gap-2">
                          {order.itinerary.stops.next.actions.pickup > 0 && (
                            <span className="flex items-center gap-0.5 text-[9px] font-black text-amber-600"><ArrowDown size={9} className="stroke-[3]" />{order.itinerary.stops.next.actions.pickup}</span>
                          )}
                          {order.itinerary.stops.next.actions.drop > 0 && (
                            <span className="flex items-center gap-0.5 text-[9px] font-black text-emerald-600"><ArrowUp size={9} className="stroke-[3]" />{order.itinerary.stops.next.actions.drop}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer: Status + Stats + Price */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${isDelivered ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' :
                      isPending ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' :
                        'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20'
                      }`}>
                      {order.status.replace('_', ' ')}
                    </span>
                    {total > 0 && (
                      <span className="text-[9px] font-bold text-slate-400 flex items-center gap-0.5">
                        <MapPin size={8} />{visited}/{total}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {(order.pricing?.amount || 0).toLocaleString()} <span className="text-[8px] text-slate-400">{order.pricing?.currency || 'CFA'}</span>
                  </span>
                </div>
              </a>
            );
          }) : (
            <div className="col-span-full py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Package size={32} className="text-slate-200 dark:text-slate-700" />
              <p className="text-sm font-bold">Aucune mission récente</p>
            </div>
          )}
        </div>
      </BentoCard>

    </div>
  );
}

const linkColorMap: Record<string, string> = {
  cyan: 'bg-cyan-500/10',
  emerald: 'bg-emerald-500/10',
  blue: 'bg-blue-500/10',
  purple: 'bg-purple-500/10',
  rose: 'bg-rose-500/10',
  amber: 'bg-amber-500/10',
};

const linkTextColorMap: Record<string, string> = {
  cyan: 'hover:text-cyan-500',
  emerald: 'hover:text-emerald-500',
  blue: 'hover:text-blue-500',
  purple: 'hover:text-purple-500',
  rose: 'hover:text-rose-500',
  amber: 'hover:text-amber-500',
};

function BentoCard({ title, icon, badge, children, className, link, linkColor = 'slate' }: any) {
  const circleBg = linkColorMap[linkColor] || 'bg-slate-500/10';
  const arrowHover = linkTextColorMap[linkColor] || 'hover:text-slate-600';
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] transition-all duration-500 ${className} group flex flex-col min-h-0 relative overflow-hidden`}>

      <header className="flex justify-between items-start flex-shrink-0 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 tracking-tight">{title}</h3>
            {badge && <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">{badge}</span>}
          </div>
        </div>
        {link && (
          <a href={link} className={`absolute flex items-end justify-start p-5 top-0 right-2 w-24 h-24 ${circleBg} rounded-full -mr-8 -mt-8 hover:scale-110 overflow-visible transition-transform cursor-pointer`}>
            <ArrowRight className='dark:text-white/80' size={20} />
          </a>
        )}
        {/* {link && (
          <a href={link} className={`p-2 rounded-full text-slate-300 ${arrowHover} transition-all z-10`}>
            
          </a>
        )} */}
      </header>
      <div className="flex-1 overflow-y-auto pr-1">
        {children}
      </div>
    </div>
  );
}
