import React, { useState, useRef } from 'react';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, Search } from 'lucide-react';
import { Schedule, User } from '../../../api/types';
import { ScheduleTimeline, ScheduleTimelineRef } from '../../../components/ScheduleTimeline';
import { ScheduleEditorSidebar } from '../../../components/ScheduleEditorSidebar';
import { DateTime } from 'luxon';
import { scheduleService } from '../../../api/schedules';
import { driverService } from '../../../api/drivers';

// ── Component ──────────────────────────────────────────────────────
export default function Page() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [drivers, setDrivers] = useState<User[]>([]);
    const [selectedSchedule, setSelectedSchedule] = useState<Partial<Schedule> | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [visibleDate, setVisibleDate] = useState(DateTime.now());
    const [isLoading, setIsLoading] = useState(false);
    const timelineRef = useRef<ScheduleTimelineRef>(null);

    // Get current user/company from storage safely (SSR compatible)
    const getCompanyId = () => {
        if (typeof window === 'undefined') return 'company_1';
        try {
            const currentUser = JSON.parse(localStorage.getItem('delivery_user') || '{}');
            return currentUser.companyId || 'company_1';
        } catch {
            return 'company_1';
        }
    };

    // Fetch initial data
    const fetchSchedules = async () => {
        setIsLoading(true);
        try {
            const companyId = getCompanyId();
            const data = await scheduleService.listSchedules(companyId);
            setSchedules(data);
        } catch (err) {
            console.error('Failed to fetch schedules:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDrivers = async () => {
        try {
            const { data } = await driverService.listDrivers();
            // Map and deduplicate by driver ID
            const uniqueDrivers = Array.from(
                new Map(data.map((d: any) => [d.driver?.id || d.id, d.driver || d])).values()
            );
            setDrivers(uniqueDrivers);
        } catch (err) {
            console.error('Failed to fetch drivers:', err);
        }
    };

    React.useEffect(() => {
        fetchSchedules();
        fetchDrivers();
    }, []);

    const handleSaveSchedule = async (data: any) => {
        try {
            const scheduleData = {
                ...data,
                ownerId: getCompanyId(),
                ownerType: 'Company'
            };

            if (data.id) {
                await scheduleService.updateSchedule(data.id, scheduleData);
            } else {
                await scheduleService.createSchedule(scheduleData);
            }

            // Refresh
            await fetchSchedules();
            setIsSidebarOpen(false);
        } catch (err) {
            console.error('Failed to save schedule:', err);
            alert('Erreur lors de la sauvegarde du planning');
        }
    };

    const handleDeleteSchedule = async (id: string) => {
        if (!confirm('Voulez-vous vraiment supprimer ce planning ?')) return;
        try {
            await scheduleService.deleteSchedule(id);
            await fetchSchedules();
            setIsSidebarOpen(false);
        } catch (err) {
            console.error('Failed to delete schedule:', err);
            alert('Erreur lors de la suppression');
        }
    };

    const navigateDate = (direction: 'prev' | 'next') => {
        const target = direction === 'next' ? visibleDate.plus({ weeks: 1 }) : visibleDate.minus({ weeks: 1 });
        setVisibleDate(target);
        timelineRef.current?.scrollToDate(target);
    };

    const goToToday = () => {
        const today = DateTime.now();
        setVisibleDate(today);
        timelineRef.current?.scrollToDate(today);
    };

    return (

        <div className="flex h-[calc(100vh-80px)] gap-5 max-w-[1800px] mx-auto px-4 lg:px-8 mb-2">            {/* Left Column: Header + Toolbar + Timeline */}
            {/* Left Column: Header + Toolbar + Timeline */}
            <div className="flex-1 min-w-0 flex flex-col space-y-5 overflow-hidden">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-emerald-500/10 rounded-[2rem] text-emerald-500">
                            <CalendarIcon size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Planning Transport</h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Gestion des rotations & horaires</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={() => { setSelectedSchedule(null); setIsSidebarOpen(true); }}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3.5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-slate-900/20"
                        >
                            <Plus size={18} />
                            Créer
                        </button>
                    </div>
                </header>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <button onClick={() => navigateDate('prev')} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all text-slate-400">
                                <ChevronLeft size={24} />
                            </button>
                            <div className="px-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
                                <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    {visibleDate.setLocale('fr').toFormat('MMMM yyyy')}
                                </span>
                            </div>
                            <button onClick={() => navigateDate('next')} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all text-slate-400">
                                <ChevronRight size={24} />
                            </button>
                        </div>

                        <button
                            onClick={goToToday}
                            className="text-[11px] font-black uppercase tracking-widest text-emerald-500 hover:bg-emerald-500/10 px-4 py-2 rounded-xl transition-all"
                        >
                            Aujourd'hui
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-emerald-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="RECHERCHER..."
                                className="pl-12 pr-6 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-3xl text-[10px] font-black tracking-widest focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none w-56 transition-all"
                            />
                        </div>
                        <button className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-emerald-500 transition-all shadow-sm">
                            <Filter size={20} />
                        </button>
                    </div>
                </div>

                {/* Timeline — horizontally scrollable */}
                <div className="flex-1 min-h-0 relative">
                    <ScheduleTimeline
                        ref={timelineRef}
                        schedules={schedules}
                        onScheduleClick={(s) => { setSelectedSchedule(s); setIsSidebarOpen(true); }}
                        onVisibleDateChange={(dt) => setVisibleDate(dt)}
                    />

                    {isLoading && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[2px] z-50 flex items-center justify-center rounded-[2.5rem]">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Synchronisation...</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Sidebar — full height on lg+ */}
            <ScheduleEditorSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                schedule={selectedSchedule}
                onSave={handleSaveSchedule}
                onDelete={handleDeleteSchedule}
                availableUsers={drivers}
            />
        </div>
    );
}
