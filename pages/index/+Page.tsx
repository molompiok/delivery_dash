import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { User, Vehicle, CompanyDriverSetting, Zone, PricingFilter, DashboardStats } from '../../api/types';
import { useHeaderAutoHide } from '../../hooks/useHeaderAutoHide';
import { fleetService } from '../../api/fleet';
import { driverService } from '../../api/drivers';
import { dashboardApi } from '../../api/dashboard';
import { MapLibre as GlobeMap } from '../../components/MapLibre';
import { formatId } from '../../api/utils';
import { socketClient } from '../../api/socket';
import { TutorialOverlay, TutorialData } from '../../components/TutorialOverlay';

const DEFAULT_TUTORIAL_URL = 'https://www.youtube.com/channel/UCD-jxvBIorOz2uAkiReh_kw';

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
  const [dashStats, setDashStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tutorials, setTutorials] = useState<Record<string, TutorialData>>({});
  const [activeTutorial, setActiveTutorial] = useState<TutorialData | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [hasPendingOrdersRefresh, setHasPendingOrdersRefresh] = useState(false);
  useHeaderAutoHide();

  useEffect(() => {
    loadDashboardData();
    loadTutorials();
  }, []);

  const loadTutorials = async () => {
    try {
      const response = await fetch('/config/dash-setting.json');
      const data = await response.json();
      if (data.tutorials) {
        setTutorials(data.tutorials);
      }
    } catch (e) {
      console.error("Failed to load tutorials", e);
    }
  };

  const openTutorial = (key: string) => {
    const tuto = tutorials[key];
    if (tuto) {
      if (!tuto.preview && tuto.tuto_video) {
        window.open(tuto.tuto_video, '_blank');
        return;
      }
      setActiveTutorial(tuto);
      setIsTutorialOpen(true);
    } else {
      // Show support contact popup case (handled by Overlay if tutorial is null but isOpen is true)
      setActiveTutorial(null);
      setIsTutorialOpen(true);
    }
  };

  const loadDashboardData = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
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

      try {
        const dStats = await dashboardApi.getStats();
        setDashStats(dStats);
      } catch (e) {
        console.error("Dashboard stats load error", e);
      }

    } catch (error) {
      console.error("Dashboard load error", error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    socketClient.joinFleetRoomFromStorage();

    const markOrdersAsStale = () => {
      setHasPendingOrdersRefresh(true);
    };

    const offOrderStatus = socketClient.on('order_status_updated', markOrdersAsStale);
    const offRoute = socketClient.on('route_updated', markOrdersAsStale);
    const offNew = socketClient.on('orders:new', markOrdersAsStale);
    const offOrderUpdated = socketClient.on('order_updated', markOrdersAsStale);

    return () => {
      offOrderStatus();
      offRoute();
      offNew();
      offOrderUpdated();
    };
  }, []);

  const refreshRecentOrders = async () => {
    await loadDashboardData(true);
    setHasPendingOrdersRefresh(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin text-emerald-500" size={40} strokeWidth={1.5} />
      </div>
    );
  }

  const setupSteps = [
    { key: 'vehicle', label: 'Véhicule', image: '/assets/setup_vehicle_cartoon_3d.png', href: '/fleet/add', completed: stats.vehiclesCount > 0 },
    { key: 'driver', label: 'Chauffeur', image: '/assets/setup_driver_cartoon_3d.png', href: '/drivers/invite', completed: stats.driversCount > 0 },
    { key: 'order', label: 'Mission', image: '/assets/setup_mission_cartoon_3d.png', href: '/orders', completed: stats.ordersCount > 0 },
  ];

  const completedCount = setupSteps.filter(s => s.completed).length;
  const progressPercent = (completedCount / setupSteps.length) * 100;
  const isSetupComplete = completedCount === setupSteps.length;


  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700 pb-40 px-4">
      {/* Refined Welcome Hero - Permanent Mode */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full -mr-32 -mt-32" />

        <div className="relative z-10 p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              {!isSetupComplete ? (
                <>
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    Étapes à compléter <span className="text-emerald-400">avant la 1ère mission</span>
                  </h2>
                  <p className="text-slate-400 text-sm font-medium">
                    Configurez votre environnement pour commencer à opérer.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    Performance <span className="text-emerald-400">de la semaine</span>
                  </h2>
                  <p className="text-slate-400 text-sm font-medium">
                    {dashStats?.missions.completed || 0} / {dashStats?.missions.total || 0} missions terminées avec succès.
                  </p>
                </>
              )}
            </div>

            {/* Progress or Activity Curve */}
            <div className="w-full md:w-80 space-y-2">
              {!isSetupComplete ? (
                <>
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">Progression globale</span>
                    <span className="text-emerald-400">{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/30">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1, ease: "circOut" }}
                      className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                    />
                  </div>
                </>
              ) : (
                <div className="h-24 pt-4">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                    <span className="text-slate-400">Activité des missions</span>
                    <span className="text-emerald-400">{dashStats?.missions.today || 0} AUJOURD'HUI</span>
                  </div>
                  <ActivityCurve data={dashStats?.weeklyActivity || []} />
                </div>
              )}
            </div>
          </div>

          {/* Horizontal Scrollable 3D Steps / Stats */}
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2 mask-fade-right">
            {setupSteps.map((step, index) => {
              const countText = step.key === 'vehicle'
                ? (dashStats?.resources.vehicles ?? stats.vehiclesCount) + ' véhicules'
                : step.key === 'driver'
                  ? (dashStats?.resources.drivers ?? stats.driversCount) + ' chauffeurs'
                  : (dashStats?.missions.today ?? 0) + ' ce jour';

              console.log(step.key, countText);
              return (
                <motion.a
                  key={step.key}
                  href={step.href}
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex-none w-72 h-40 relative overflow-hidden rounded-[2rem] border transition-all duration-500 group ${step.completed
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                >
                  {/* 3D Asset in Background */}
                  <div className="absolute -bottom-4 -right-4 w-40 h-40 group-hover:scale-110 transition-transform duration-700 pointer-events-none opacity-80 group-hover:opacity-100">
                    <img
                      src={step.image}
                      className={`w-full h-full object-contain object-bottom-right transition-all ${step.completed ? '' : 'grayscale-[0.5]'}`}
                      alt={step.label}
                    />
                  </div>

                  <div className="relative z-10 p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between">
                      <div className={`px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-widest transition-all ${step.completed
                        ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-slate-400 group-hover:text-slate-200'
                        }`}>
                        {step.completed ? 'Opérationnel' : 'À faire'}
                      </div>
                      {step.completed && <CheckCircle2 size={16} className="text-emerald-500" />}
                    </div>

                    <div className="mt-auto">
                      <h3 className={`font-black text-xl tracking-tight ${step.completed ? 'text-emerald-400' : 'text-slate-100'
                        }`}>
                        {step.label}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-200 uppercase tracking-widest mt-1">
                        {isSetupComplete ? countText : (step.completed ? 'Étape validée' : 'Configuration requise')}
                      </p>
                    </div>

                    {(isSetupComplete || !step.completed) && (
                      <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight size={14} className="text-emerald-400" />
                      </div>
                    )}
                  </div>
                </motion.a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 auto-rows-[140px] md:auto-rows-[160px] gap-4">

        {/* 4. Map Action - (4x2) */}
        <a href="/map" className="col-span-12 md:col-span-6 lg:col-span-4 row-span-2 group relative overflow-hidden rounded-[2.5rem] dark:bg-slate-900 bg-slate-50 border border-slate-50 dark:border-slate-700 shadow-xl">
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
          {data.zones.length > 0 ? (
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
          ) : (
            <EmptyCardCta
              title="Aucune zone configurée"
              description="Créez vos zones pour router automatiquement vos opérations."
              primaryHref="/map?tab=ZONES"
              primaryLabel="Créer une zone"
              onTutorialClick={() => openTutorial('zones_config')}
            />
          )}
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
          link="/fleet"
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
            {data.vehicles.length === 0 && (
              <EmptyCardCta
                title="Aucun véhicule enregistré"
                description="Ajoutez votre premier véhicule pour commencer à dispatcher."
                primaryHref="/fleet/add"
                primaryLabel="Ajouter un véhicule"
                onTutorialClick={() => openTutorial('fleet_setup')}
              />
            )}
          </div>
        </BentoCard>

        {/* 2. Team - Smaller but rich (5x3) */}
        <BentoCard
          className="col-span-12 md:col-span-6 lg:col-span-5 row-span-2"
          title="Équipe"
          icon={<Users size={22} className="text-blue-500" />}
          link="/drivers"
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
            {data.drivers.length > 0 ? (
              <div className="space-y-2">
                {data.drivers.map(cds => (
                  <a
                    key={cds.id}
                    href={`/drivers/${cds.driverId}`}
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
            ) : (
              <EmptyCardCta
                title="Aucun chauffeur dans l'équipe"
                description="Invitez vos chauffeurs pour démarrer les affectations."
                primaryHref="/drivers/invite"
                primaryLabel="Inviter un chauffeur"
                onTutorialClick={() => openTutorial('drivers_invite')}
              />
            )}
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
        headerActions={hasPendingOrdersRefresh ? (
          <button
            onClick={refreshRecentOrders}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/15"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            Rafraichir
          </button>
        ) : null}
      >
        {hasPendingOrdersRefresh && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/15 dark:bg-emerald-500/10 dark:text-emerald-200">
            <div className="flex items-center gap-2">
              <Bell size={15} className="shrink-0" />
              <span className="font-semibold">
                De nouvelles missions ou mises a jour sont disponibles.
              </span>
            </div>
            <button
              onClick={refreshRecentOrders}
              className="shrink-0 rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white hover:bg-emerald-500"
            >
              Refresh
            </button>
          </div>
        )}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.orders.length > 0 ? data.orders.map((order: OrderSummary) => {
            const progress = order.itinerary?.progressPercent || 0;
            const visited = order.itinerary?.visitedCount || 0;
            const total = order.itinerary?.totalStops || 0;
            const isDelivered = order.status === 'DELIVERED';
            const isPending = order.status === 'PENDING';
            const isActive = !isDelivered && !isPending && progress > 0;
            const driverName = order.attribution?.driver?.name?.trim() || 'Chauffeur';
            const driverInitials = driverName
              .split(/\s+/)
              .filter(Boolean)
              .map((part) => part[0])
              .join('')
              .substring(0, 2) || 'CH';
            const driverFirstName = driverName.split(/\s+/)[0] || 'Chauffeur';

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
                        {driverInitials}
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate max-w-[60px]">{driverFirstName}</span>
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
              <div className="mt-2 flex items-center gap-2">
                <a
                  href="/orders"
                  className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-black tracking-wide hover:opacity-90 transition-opacity"
                >
                  Créer une mission
                </a>
                <button
                  onClick={() => openTutorial('dashboard_setup')}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  voir tuto <ChevronRight className='w-4 h-4' />
                </button>
              </div>
            </div>
          )}
        </div>
      </BentoCard>

      <TutorialOverlay
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        tutorial={activeTutorial}
      />
    </div>
  );
}

function ActivityCurve({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;

  const maxCount = Math.max(...data.map(d => d.count), 5);
  const height = 40;
  const width = 300;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (d.count / maxCount) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full h-full flex flex-col">
      <svg viewBox={`0 0 ${width} ${height + 10}`} className="w-full overflow-visible">
        {/* Fill Area */}
        <path
          d={`M 0 ${height} L ${points} L ${width} ${height} Z`}
          className="fill-emerald-500/10"
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-emerald-500"
        />
        {/* Points */}
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * width;
          const y = height - (d.count / maxCount) * height;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              className="fill-white stroke-emerald-500 stroke-2"
            />
          );
        })}
      </svg>
      <div className="flex justify-between mt-2">
        {data.map((d, i) => (
          <span key={i} className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">
            {d.dayName}
          </span>
        ))}
      </div>
    </div>
  );
}

function EmptyCardCta({
  title,
  description,
  primaryHref,
  primaryLabel,
  onTutorialClick
}: {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  onTutorialClick?: () => void;
}) {
  return (
    <div className="mt-3 rounded-2xl  p-4 text-center">
      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{title}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <a
          href={primaryHref}
          className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white  text-xs font-black tracking-wide hover:opacity-90 transition-opacity"
        >
          {primaryLabel}
        </a>
        <button
          onClick={() => onTutorialClick?.()}
          className="flex gap-2 items-center px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          voir tuto <ChevronRight className='w-4 h-4' />
        </button>
      </div>
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

function BentoCard({ title, icon, badge, children, className, link, linkColor = 'slate', headerActions }: any) {
  const circleBg = linkColorMap[linkColor] || 'bg-slate-500/10';
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
        {headerActions && (
          <div className="mr-16 flex items-center gap-2">
            {headerActions}
          </div>
        )}
        {link && (
          <a href={link} className={`absolute flex items-end justify-start p-5 top-0 right-2 w-24 h-24 ${circleBg} rounded-full -mr-8 -mt-8 hover:scale-110 overflow-visible transition-transform cursor-pointer`}>
            <ArrowRight className='dark:text-white/80' size={20} />
          </a>
        )}

      </header>
      <div className="flex-1 overflow-y-auto pr-1">
        {children}
      </div>
    </div>
  );
}
